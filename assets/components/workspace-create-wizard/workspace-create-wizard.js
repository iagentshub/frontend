// workspace-create-wizard.js — modal de creación de grupo de trabajo (nombre + compartir contenido existente)
'use strict';

var WorkspaceCreateWizard = (function () {
    var _modal = null;
    var _step = 1; // 1: nombre, 2: ¿compartir contenido?, 3: selector
    var _wsId = null;
    var _wsName = null;
    var _me = null;
    var _onDone = null; // callback opcional tras crear el grupo
    var _selected = { agent: {}, skill: {}, knowledge: {}, connection: {} };
    var _personal = { agent: [], skill: [], knowledge: [], connection: [] };
    var _activeTab = 'agent';
    var _loadingContent = false;

    var _TYPE_LABEL = { agent: 'Agentes', skill: 'Skills', knowledge: 'Conocimiento', connection: 'Conexiones' };

    function _inject() {
        if (document.getElementById('wcw-modal')) return;
        var el = document.createElement('div');
        el.id = 'wcw-modal';
        el.className = 'modal-bg';
        el.style.display = 'none';
        el.innerHTML =
            '<div class="modal-box wcw-box">' +
            '<div class="modal-header">' +
            '<span class="modal-title" id="wcw-title">Nuevo grupo de trabajo</span>' +
            '<button class="modal-close" id="wcw-close" type="button">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body" id="wcw-body"></div>' +
            '<div class="modal-footer" id="wcw-footer"></div>' +
            '</div>';
        document.body.appendChild(el);
        _modal = el;

        el.addEventListener('click', function (e) { if (e.target === el) _close(); });
        document.getElementById('wcw-close').addEventListener('click', _close);
    }

    function _close() {
        if (_modal) _modal.style.display = 'none';
    }

    function _render() {
        if (_step === 1) _renderStep1();
        else if (_step === 2) _renderStep2();
        else _renderStep3();
    }

    // ── Paso 1: nombre ──────────────────────────────────────────────────────

    function _renderStep1() {
        document.getElementById('wcw-title').textContent = 'Nuevo grupo de trabajo';
        document.getElementById('wcw-body').innerHTML =
            '<label class="wcw-label" for="wcw-name-input">Nombre del grupo</label>' +
            '<input type="text" id="wcw-name-input" class="input" maxlength="80" placeholder="p. ej. Equipo de Marketing" autocomplete="off" />' +
            '<div class="wcw-error" id="wcw-error" hidden></div>';
        document.getElementById('wcw-footer').innerHTML =
            '<button class="btn btn-ghost" id="wcw-cancel">Cancelar</button>' +
            '<button class="btn btn-primary" id="wcw-create">Crear grupo</button>';

        var input = document.getElementById('wcw-name-input');
        var createBtn = document.getElementById('wcw-create');
        input.focus();
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') createBtn.click(); });
        document.getElementById('wcw-cancel').addEventListener('click', _close);
        createBtn.addEventListener('click', _submitStep1);
    }

    function _showError(msg) {
        var err = document.getElementById('wcw-error');
        if (!err) return;
        err.textContent = msg;
        err.hidden = false;
    }

    async function _submitStep1() {
        var input = document.getElementById('wcw-name-input');
        var name = (input.value || '').trim();
        if (!name) { _showError('El nombre es obligatorio'); return; }
        var btn = document.getElementById('wcw-create');
        btn.disabled = true;
        try {
            var ws = await api.post('/api/workspaces', { name: name });
            _wsId = ws.id;
            _wsName = ws.name;
            _step = 2;
            _render();
        } catch (e) {
            _showError(e.message || 'No se pudo crear el grupo de trabajo');
        } finally {
            btn.disabled = false;
        }
    }

    // ── Paso 2: ¿compartir contenido existente? ─────────────────────────────

    function _renderStep2() {
        document.getElementById('wcw-title').textContent = _wsName;
        document.getElementById('wcw-body').innerHTML =
            '<p class="wcw-question">¿Quieres compartir contenido tuyo con este grupo?</p>' +
            '<p class="wcw-hint">Puedes compartir agentes, skills, conocimiento o conexiones con el grupo. El original seguirá siendo tuyo; los miembros podrán usarlo pero no editarlo.</p>';
        document.getElementById('wcw-footer').innerHTML =
            '<button class="btn btn-ghost" id="wcw-skip">No, más tarde</button>' +
            '<button class="btn btn-primary" id="wcw-yes">Sí, compartir contenido</button>';

        document.getElementById('wcw-skip').addEventListener('click', _finish);
        document.getElementById('wcw-yes').addEventListener('click', function () {
            _step = 3;
            _render();
        });
    }

    // ── Paso 3: selector multi-tipo ─────────────────────────────────────────

    function _renderStep3() {
        document.getElementById('wcw-title').textContent = _wsName;
        document.getElementById('wcw-body').innerHTML =
            '<div class="wcw-tabs" id="wcw-tabs"></div>' +
            '<div class="wcw-list" id="wcw-list"><p class="wcw-loading">Cargando…</p></div>';
        document.getElementById('wcw-footer').innerHTML =
            '<button class="btn btn-ghost" id="wcw-skip3">Omitir</button>' +
            '<button class="btn btn-primary" id="wcw-add">Compartir seleccionados</button>';

        document.getElementById('wcw-skip3').addEventListener('click', _finish);
        document.getElementById('wcw-add').addEventListener('click', _addSelected);

        _renderTabs();
        if (!_loadingContent) _loadPersonalContent();
    }

    function _renderTabs() {
        var tabs = document.getElementById('wcw-tabs');
        if (!tabs) return;
        tabs.innerHTML = Object.keys(_TYPE_LABEL).map(function (type) {
            var count = _personal[type].length;
            var active = type === _activeTab ? ' wcw-tab--active' : '';
            return '<button type="button" class="wcw-tab' + active + '" data-tab="' + type + '">' +
                esc(_TYPE_LABEL[type]) + (count ? ' (' + count + ')' : '') +
                '</button>';
        }).join('');
        tabs.querySelectorAll('.wcw-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                _activeTab = btn.getAttribute('data-tab');
                _renderTabs();
                _renderList();
            });
        });
    }

    async function _loadPersonalContent() {
        _loadingContent = true;
        try {
            var results = await Promise.all([
                api.get('/api/agents?scope=private').catch(function () { return []; }),
                api.get('/api/skills?scope=private').catch(function () { return []; }),
                api.get('/api/knowledge').catch(function () { return []; }),
                api.get('/api/connections').catch(function () { return []; }),
            ]);
            _personal.agent = (results[0] || []).filter(function (a) { return !a._shared; });
            _personal.skill = (results[1] || []).filter(function (s) { return !s._shared; });
            _personal.knowledge = (results[2] || []).filter(function (k) { return !k._shared; });
            _personal.connection = (results[3] || []).filter(function (c) { return !c._shared && c.owner_id === _me; });
        } finally {
            _loadingContent = false;
            _renderTabs();
            _renderList();
        }
    }

    function _itemName(type, item) {
        return item.name || item.title || item.id;
    }

    function _renderList() {
        var list = document.getElementById('wcw-list');
        if (!list) return;
        var items = _personal[_activeTab];
        if (!items.length) {
            list.innerHTML = '<p class="wcw-empty">No tienes ' + esc(_TYPE_LABEL[_activeTab].toLowerCase()) + ' propios.</p>';
            return;
        }
        var type = _activeTab;
        list.innerHTML = items.map(function (item) {
            var checked = _selected[type][item.id] ? ' checked' : '';
            return '<label class="wcw-item">' +
                '<input type="checkbox" data-type="' + type + '" data-id="' + esc(item.id) + '"' + checked + ' />' +
                '<span class="wcw-item-name">' + esc(_itemName(type, item)) + '</span>' +
                '<span class="wcw-item-badge">Compartir</span>' +
                '</label>';
        }).join('');

        list.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var t = cb.getAttribute('data-type');
                var id = cb.getAttribute('data-id');
                if (cb.checked) _selected[t][id] = true;
                else delete _selected[t][id];
            });
        });
    }

    async function _addSelected() {
        var btn = document.getElementById('wcw-add');
        btn.disabled = true;
        var jobs = [];

        // Compartir todos los tipos usando el API de sharing con group_id
        ['agent', 'skill', 'knowledge', 'connection'].forEach(function (type) {
            Object.keys(_selected[type]).forEach(function (id) {
                jobs.push(api.post('/api/sharing/' + type + '/' + encodeURIComponent(id), { group_id: _wsId }));
            });
        });

        if (!jobs.length) { await _finish(); return; }

        var results = await Promise.allSettled(jobs);
        var failed = results.filter(function (r) { return r.status === 'rejected'; }).length;
        if (failed) {
            if (typeof toast === 'function') toast(failed + ' de ' + jobs.length + ' elementos no se pudieron compartir', 'error');
        } else {
            if (typeof toast === 'function') toast('Contenido compartido con el grupo', 'ok');
        }
        btn.disabled = false;
        await _finish();
    }

    // ── Fin ──────────────────────────────────────────────────────────────────

    async function _finish() {
        _close();
        // Ejecutar callback del llamador (p.ej. GroupPanel.load o profile load)
        if (typeof _onDone === 'function') {
            try { _onDone(); } catch (e) { /* ignorar */ }
        }
        // Refrescar también cualquier panel de grupos visible en la página
        if (window._groupPanelAgents) window._groupPanelAgents.load();
        if (window._groupPanelConn)   window._groupPanelConn.load();
    }

    // ── API pública ──────────────────────────────────────────────────────────

    async function open(onDone) {
        _inject();
        _step = 1;
        _wsId = null;
        _wsName = null;
        _onDone = typeof onDone === 'function' ? onDone : null;
        _selected = { agent: {}, skill: {}, knowledge: {}, connection: {} };
        _personal = { agent: [], skill: [], knowledge: [], connection: [] };
        _activeTab = 'agent';
        _loadingContent = false;
        if (!_me) {
            try {
                var me = await api.get('/api/auth/me');
                _me = me.username;
            } catch (e) { /* se resolverá al listar conexiones si falla */ }
        }
        _render();
        _modal.style.display = '';
    }

    return { open: open };
})();

window.WorkspaceCreateWizard = WorkspaceCreateWizard;

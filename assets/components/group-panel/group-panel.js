// group-panel.js — panel lateral de grupos de trabajo.
// Al seleccionar un grupo, llama al callback onGroupSelect(groupId).
// onGroupSelect(null) → sin filtro (ver todo).
//
// Soporta drag & drop: arrastrar una tarjeta sobre un grupo comparte el recurso.
// Para activarlo, pasa la sección como primer argumento: GroupPanel('agents', cb).
// Las secciones soportadas se mapean al resource_type de la API de sharing.
'use strict';

// Mapeo data-drag-section → resource_type de /api/sharing
var _GP_TYPE = {
    'agents':     'agent',
    'skill':      'skill',
    'url':        'knowledge',
    'document':   'knowledge',
    'memory':     'knowledge',
    'connection': 'connection',
};

function GroupPanel(section, onGroupSelect) {
    // Compatibilidad con la firma original: GroupPanel(onGroupSelect)
    if (typeof section === 'function') {
        onGroupSelect = section;
        section = null;
    }

    var _groups   = [];
    var _activeId = null; // null = "Todos"
    var _panelEl  = null;

    // Tipo de recurso derivado de la sección (null si no se indicó sección)
    var _resType = section ? (_GP_TYPE[section] || null) : null;

    // ── Drop handler ─────────────────────────────────────────────────────────

    function _handleGroupDrop(groupId) {
        if (!_resType || !window._kDrag) return;
        if (window._kDrag.section !== section) return;
        var itemId = window._kDrag.id;
        api.post('/api/sharing/' + _resType + '/' + encodeURIComponent(itemId), { group_id: groupId })
            .then(function (res) {
                var extra = (res.cascaded && res.cascaded.length)
                    ? ' (+' + res.cascaded.length + ' recurso' + (res.cascaded.length > 1 ? 's' : '') + ' asociado' + (res.cascaded.length > 1 ? 's' : '') + ')'
                    : '';
                if (typeof toast === 'function') toast('Compartido con el grupo' + extra, 'success');
            })
            .catch(function (e) {
                if (typeof toast === 'function') toast(e.message || 'Error al compartir', 'error');
            });
    }

    // ── Render ───────────────────────────────────────────────────────────────

    function _render() {
        if (!_panelEl) return;

        var canCreate = window._navUserRole !== 'guest' && window.WorkspaceCreateWizard;
        var addBtn = canCreate
            ? '<button class="kf-add-btn gp-add-btn" title="Nuevo grupo">' +
              '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
              '</button>'
            : '';

        var html = '<div class="kf-section-header">' +
            '<span class="kf-section-label">Grupos</span>' +
            addBtn +
            '</div>' +
            '<button class="kf-item' + (_activeId === null ? ' kf-item--active' : '') + '" data-gp-id="">' +
            '<span class="kf-item-name">Todos</span>' +
            '</button>';

        if (!_groups.length) {
            html += '<p class="gp-empty">No perteneces a ningún grupo.</p>';
        } else {
            _groups.forEach(function (g) {
                var active = _activeId === g.id;
                // El título en el tooltip guía al usuario sobre el drag
                var dropHint = _resType ? ' title="Arrastra aquí para compartir con ' + esc(g.name) + '"' : '';
                html += '<button class="kf-item gp-item' + (active ? ' kf-item--active' : '') + '"' +
                    ' data-gp-id="' + esc(g.id) + '"' + dropHint + '>' +
                    '<span class="kf-item-name">' + esc(g.name) + '</span>' +
                    '</button>';
            });
        }

        _panelEl.innerHTML = html;
        _bindEvents();
    }

    // ── Events ───────────────────────────────────────────────────────────────

    function _bindEvents() {
        if (!_panelEl) return;

        var addBtn = _panelEl.querySelector('.gp-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                WorkspaceCreateWizard.open(load);
            });
        }

        _panelEl.querySelectorAll('.kf-item[data-gp-id]').forEach(function (btn) {
            var gpId = btn.dataset.gpId || null;

            // Selección de grupo
            btn.addEventListener('click', function () {
                if (_activeId === gpId) return;
                _activeId = gpId;
                _render();
                if (onGroupSelect) onGroupSelect(_activeId);
            });

            // Drag & drop — solo botones de grupo (no el "Todos")
            if (!gpId || !_resType) return;

            btn.addEventListener('dragover', function (e) {
                if (!window._kDrag || window._kDrag.section !== section) return;
                e.preventDefault();
                btn.classList.add('kd-drag-over');
            });
            btn.addEventListener('dragleave', function (e) {
                if (!btn.contains(e.relatedTarget)) btn.classList.remove('kd-drag-over');
            });
            btn.addEventListener('drop', function (e) {
                e.preventDefault();
                btn.classList.remove('kd-drag-over');
                _handleGroupDrop(gpId);
            });
        });
    }

    // ── Public API ───────────────────────────────────────────────────────────

    function load() {
        if (window._navUserRole === 'guest') return Promise.resolve();
        return api.get('/api/workspaces')
            .then(function (data) {
                _groups = data || [];
                _render();
            })
            .catch(function () {});
    }

    function mount(panelEl) {
        _panelEl = panelEl;
        _render();
    }

    function clearSelection() {
        _activeId = null;
        _render();
    }

    function syncActive(id) {
        _activeId = id || null;
        _render();
    }

    function getActive() {
        return _activeId;
    }

    return {
        mount: mount,
        load: load,
        clearSelection: clearSelection,
        syncActive: syncActive,
        getActive: getActive,
    };
}

window.GroupPanel = GroupPanel;

// knowledge-visibility.js — dialog de visibilidad para carpetas de knowledge
'use strict';

var KnowledgeVisibilityDialog = (function () {
    var _folder = null;
    var _onDone = null;

    var _CATEGORIES = ['Coding','Writing','Research','Data','DevOps','Support','Education','Productivity','Marketing','Finance','Other'];

    function _getEl(id) { return document.getElementById(id); }

    function _buildDialog() {
        if (_getEl('kv-dialog')) return;
        var el = document.createElement('div');
        el.innerHTML = '<div id="kv-dialog" class="modal-bg" style="display:none">' +
            '<div class="modal-box" style="width:460px">' +
            '<div class="modal-header"><span class="modal-title" data-i18n="social.visibility.knowledge_title">Visibilidad de la carpeta</span>' +
            '<button class="modal-close" id="kv-close" type="button"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
            '</div>' +
            '<div class="modal-body">' +
            '<div id="kv-step-1">' +
            '<label class="toggle-label" style="margin-bottom:12px">' +
            '<input type="checkbox" id="kv-public-cb" class="toggle-checkbox"/>' +
            '<span class="toggle-track"></span>' +
            '<span data-i18n="social.visibility.make_public">Hacer público en el explorador</span>' +
            '</label>' +
            '<div id="kv-opts" style="display:none;margin-top:10px">' +
            '<select id="kv-category" class="select" style="max-width:200px">' +
            _CATEGORIES.map(function (c) { return '<option value="' + c + '"' + (c === 'Other' ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
            '</select>' +
            '</div>' +
            '</div>' +
            '<div id="kv-step-2" style="display:none">' +
            '<div class="alert alert-warn" style="margin-bottom:14px">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><path d="M8 1.5L1 14.5h14L8 1.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 6v4M8 11.5v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
            '<span data-i18n="social.visibility.knowledge_warning">Esta carpeta puede contener información sensible (URLs, documentos, datos personales). Al hacerla pública cualquier usuario registrado podrá verla. ¿Estás seguro?</span>' +
            '</div>' +
            '<p style="font-size:13px;color:var(--ink-muted)" data-i18n="social.visibility.knowledge_confirm_hint">Escribe <strong>PUBLICAR</strong> para confirmar:</p>' +
            '<input id="kv-confirm-input" class="input" placeholder="PUBLICAR" style="margin-top:8px"/>' +
            '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-ghost" id="kv-cancel" data-i18n="common.actions.cancel">Cancelar</button>' +
            '<button type="button" class="btn btn-primary" id="kv-save" style="margin-left:auto" data-i18n="social.visibility.save_btn">Guardar</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(el.firstChild);

        _getEl('kv-close').addEventListener('click', _close);
        _getEl('kv-cancel').addEventListener('click', _close);
        _getEl('kv-dialog').addEventListener('click', function (e) { if (e.target === this) _close(); });

        _getEl('kv-public-cb').addEventListener('change', function () {
            _getEl('kv-opts').style.display = this.checked ? '' : 'none';
        });

        _getEl('kv-save').addEventListener('click', _onSave);
    }

    function _close() {
        var d = _getEl('kv-dialog');
        if (d) d.style.display = 'none';
    }

    async function _onSave() {
        var isPublic = _getEl('kv-public-cb').checked;
        var step2    = _getEl('kv-step-2');

        if (isPublic && step2 && step2.style.display === 'none') {
            // First confirm step for making public
            step2.style.display = '';
            _getEl('kv-step-1').style.display = 'none';
            return;
        }

        if (isPublic && step2 && step2.style.display !== 'none') {
            var confirmVal = (_getEl('kv-confirm-input').value || '').trim().toUpperCase();
            if (confirmVal !== 'PUBLICAR') {
                toast(t('social.visibility.knowledge_confirm_error') || 'Escribe PUBLICAR para confirmar', 'error');
                return;
            }
        }

        var saveBtn = _getEl('kv-save');
        saveBtn.disabled = true;
        try {
            await api.put('/api/knowledge/folders/' + _folder.id + '/visibility', {
                is_public: isPublic,
                category: (_getEl('kv-category') || {}).value || 'Other',
            });
            toast(t('social.visibility.saved') || 'Visibilidad guardada', 'success');
            _close();
            if (_onDone) _onDone();
        } catch (err) {
            toast(err.message, 'error');
        } finally {
            saveBtn.disabled = false;
        }
    }

    function open(folder, onDone) {
        _buildDialog();
        _folder = folder;
        _onDone = onDone;

        var pubCb = _getEl('kv-public-cb');
        var opts  = _getEl('kv-opts');
        var step1 = _getEl('kv-step-1');
        var step2 = _getEl('kv-step-2');
        var confirmInput = _getEl('kv-confirm-input');

        pubCb.checked = false;
        if (opts) opts.style.display = 'none';
        if (step1) step1.style.display = '';
        if (step2) { step2.style.display = 'none'; }
        if (confirmInput) confirmInput.value = '';

        api.get('/api/social/me/resources?type=knowledge').then(function (data) {
            var row = (data.resources || []).find(function (r) { return r.resource_id === folder.id; });
            if (!row) return;
            pubCb.checked = !!row.is_public;
            if (opts) opts.style.display = row.is_public ? '' : 'none';
            var catEl = _getEl('kv-category');
            if (catEl && row.category) catEl.value = row.category;
        }).catch(function () {});

        _getEl('kv-dialog').style.display = 'flex';
    }

    return { open: open };
}());

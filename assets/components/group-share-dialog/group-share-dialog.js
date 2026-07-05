// group-share-dialog.js — modal para compartir un recurso con grupos de trabajo.
// Muestra los grupos del usuario con su estado actual (compartido / no compartido)
// y permite activar/desactivar el acceso por grupo.
'use strict';

var GroupShareDialog = (function () {
    var _modal = null;
    var _resourceType = null;
    var _resourceId = null;
    var _resourceName = null;
    var _onSuccess = null;
    var _groups = [];
    var _sharedGroupIds = new Set();
    var _pending = new Set(); // grupos seleccionados en esta sesión

    function _ensureModal() {
        if (_modal) return;
        _modal = document.createElement('div');
        _modal.className = 'modal-bg';
        _modal.id = 'group-share-modal';
        _modal.style.display = 'none';
        document.body.appendChild(_modal);
        _modal.addEventListener('click', function (e) {
            if (e.target === _modal) close();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && _modal.style.display !== 'none') close();
        });
    }

    function _render() {
        var title = (typeof t === 'function' ? t('teams.sharing.modal_title', { name: _resourceName }) : null)
            || ('Compartir — ' + _resourceName);
        var noGroupsMsg = typeof t === 'function' ? t('teams.sharing.no_groups') : 'No tienes grupos de trabajo.';
        var saveLabel = typeof t === 'function' ? t('teams.sharing.confirm') || 'Guardar' : 'Guardar';
        var cancelLabel = typeof t === 'function' ? t('teams.sharing.cancel') || 'Cancelar' : 'Cancelar';
        var selectLabel = typeof t === 'function' ? t('teams.sharing.select_groups') || 'Selecciona los grupos' : 'Selecciona los grupos';

        var groupsHtml;
        if (!_groups.length) {
            groupsHtml = '<p class="gsd-empty">' + noGroupsMsg + '</p>';
        } else {
            groupsHtml = _groups.map(function (g) {
                var checked = _pending.has(g.id);
                return '<label class="gsd-group-row">' +
                    '<input type="checkbox" class="gsd-checkbox" data-group-id="' + esc(g.id) + '"' +
                    (checked ? ' checked' : '') + '>' +
                    '<span class="gsd-group-name">' + esc(g.name) + '</span>' +
                    (checked ? '<span class="gsd-badge">' + (typeof t === 'function' ? t('teams.sharing.shared_badge') || 'Compartido' : 'Compartido') + '</span>' : '') +
                    '</label>';
            }).join('');
        }

        _modal.innerHTML =
            '<div class="modal-box">' +
            '<div class="modal-header">' +
            '<h2 class="modal-title">' + esc(title) + '</h2>' +
            '<button class="modal-close" id="gsd-close">' +
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body">' +
            '<p class="gsd-subtitle">' + esc(selectLabel) + '</p>' +
            '<div class="gsd-groups">' + groupsHtml + '</div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-ghost" id="gsd-cancel">' + esc(cancelLabel) + '</button>' +
            '<button class="btn btn-primary" id="gsd-save">' + esc(saveLabel) + '</button>' +
            '</div>' +
            '</div>';

        _modal.querySelector('#gsd-close').addEventListener('click', close);
        _modal.querySelector('#gsd-cancel').addEventListener('click', close);
        _modal.querySelector('#gsd-save').addEventListener('click', _save);

        _modal.querySelectorAll('.gsd-checkbox').forEach(function (cb) {
            cb.addEventListener('change', function () {
                var gid = cb.dataset.groupId;
                if (cb.checked) { _pending.add(gid); } else { _pending.delete(gid); }
            });
        });
    }

    async function _save() {
        var saveBtn = _modal.querySelector('#gsd-save');
        if (saveBtn) saveBtn.disabled = true;

        var errors = [];
        var added = 0;
        var removed = 0;

        // Compartir con grupos marcados que no lo estaban antes
        for (var gid of Array.from(_pending)) {
            if (!_sharedGroupIds.has(gid)) {
                try {
                    var res = await api.post('/api/sharing/' + _resourceType + '/' + encodeURIComponent(_resourceId), { group_id: gid });
                    added++;
                    // Si el backend cascade-compartió skills/knowledge, mostrar info
                    if (res && res.cascaded && res.cascaded.length) {
                        console.info('[sharing] Cascade: ' + res.cascaded.length + ' recursos adicionales compartidos');
                    }
                } catch (e) {
                    errors.push(e.message || 'Error al compartir con el grupo');
                }
            }
        }
        // Dejar de compartir con grupos desmarcados que lo estaban antes
        for (var gid2 of Array.from(_sharedGroupIds)) {
            if (!_pending.has(gid2)) {
                try {
                    await api.del('/api/sharing/' + _resourceType + '/' + encodeURIComponent(_resourceId) + '?group_id=' + encodeURIComponent(gid2));
                    removed++;
                } catch (e) {
                    errors.push(e.message || 'Error al quitar el acceso');
                }
            }
        }

        close();
        if (errors.length === 0) {
            if (typeof toast === 'function') {
                var msg = typeof t === 'function' ? t('teams.sharing.saved') || 'Acceso actualizado' : 'Acceso actualizado';
                toast(msg, 'ok');
            }
        } else {
            if (typeof toast === 'function') toast(errors[0], 'error');
        }
        if (_onSuccess) _onSuccess();
    }

    async function open(resourceType, resourceId, resourceName, onSuccess) {
        _ensureModal();
        _resourceType = resourceType;
        _resourceId = resourceId;
        _resourceName = resourceName || resourceId;
        _onSuccess = onSuccess || null;
        _groups = [];
        _sharedGroupIds = new Set();
        _pending = new Set();

        // Cargar grupos del usuario
        try {
            var ws = await api.get('/api/workspaces');
            _groups = (ws || []).filter(function (g) { return g.type === 'team'; });
        } catch (e) { _groups = []; }

        // Detectar en qué grupos está ya compartido (leyendo la lista de recursos compartidos)
        // Si el recurso tiene _shared_groups en sus datos, usarlos; si no, inferir desde los grupos
        // donde el recurso aparece en su lista de shared_ids.
        // Por ahora dejamos _sharedGroupIds vacío y cargamos el estado real del backend si está disponible.
        try {
            var shared = await api.get('/api/sharing/' + resourceType + '/' + encodeURIComponent(resourceId) + '/groups');
            (shared.group_ids || []).forEach(function (gid) {
                _sharedGroupIds.add(gid);
                _pending.add(gid); // pre-marcar los ya compartidos
            });
        } catch (e) {
            // El endpoint puede no existir aún; arrancar sin estado previo
        }

        _render();
        _modal.style.display = '';
    }

    function close() {
        if (_modal) _modal.style.display = 'none';
    }

    return { open: open, close: close };
})();

window.GroupShareDialog = GroupShareDialog;

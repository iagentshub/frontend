// share-teams.js — modal reutilizable para compartir recursos con equipos
'use strict';

(function () {
    var _resourceType = null;
    var _resourceId = null;
    var _resourceName = null;
    var _originalShared = [];
    var _userTeams = [];

    var _PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777'];

    function _teamColor(name) {
        var c = 0;
        for (var i = 0; i < name.length; i++) c += name.charCodeAt(i);
        return _PALETTE[c % _PALETTE.length];
    }

    function _injectStyles() {
        if (document.getElementById('share-teams-styles')) return;
        var style = document.createElement('style');
        style.id = 'share-teams-styles';
        style.textContent = [
            '.share-team-list { display:flex; flex-direction:column; gap:2px; padding:8px 0; }',
            '.share-team-row { display:flex; align-items:center; gap:10px; padding:10px 14px;',
            '  border-radius:8px; cursor:pointer; transition:background .1s; user-select:none; }',
            '.share-team-row:hover { background:var(--surface-2,#f5f5f5); }',
            '.share-team-row input[type="checkbox"] { flex-shrink:0; accent-color:var(--accent,#4f46e5);',
            '  width:15px; height:15px; cursor:pointer; }',
            '.share-team-avatar { flex-shrink:0; width:30px; height:30px; border-radius:8px;',
            '  display:flex; align-items:center; justify-content:center;',
            '  font-size:13px; font-weight:700; color:#fff; }',
            '.share-team-name { flex:1; font-size:13px; font-weight:500;',
            '  color:var(--ink,#111); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
        ].join('\n');
        document.head.appendChild(style);
    }

    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function _ensureModal() {
        if (document.getElementById('modal-share-teams')) return;
        _injectStyles();
        var div = document.createElement('div');
        div.innerHTML =
            '<div id="modal-share-teams" class="modal-bg" style="display:none">' +
            '<div class="modal-box" style="max-width:440px">' +
            '<div class="modal-header">' +
            '<h3 class="modal-title" id="share-teams-title"></h3>' +
            '<button class="modal-close" id="btn-share-teams-close">' +
            '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body" id="share-teams-body" style="padding:4px 10px;gap:0"></div>' +
            '<div class="modal-footer">' +
            '<button class="btn btn-ghost" id="btn-share-teams-cancel"></button>' +
            '<button class="btn btn-primary" id="btn-share-teams-save"></button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(div.firstElementChild);

        document.getElementById('btn-share-teams-close').addEventListener('click', _close);
        document.getElementById('btn-share-teams-cancel').addEventListener('click', _close);
        document.getElementById('modal-share-teams').addEventListener('click', function (e) {
            if (e.target === this) _close();
        });
        document.getElementById('btn-share-teams-save').addEventListener('click', _save);
    }

    function _close() {
        var modal = document.getElementById('modal-share-teams');
        if (modal) modal.style.display = 'none';
    }

    async function open(resourceType, resourceId, resourceName) {
        _ensureModal();
        _resourceType = resourceType;
        _resourceId = resourceId;
        _resourceName = resourceName;

        var modal = document.getElementById('modal-share-teams');
        var titleEl = document.getElementById('share-teams-title');
        var bodyEl = document.getElementById('share-teams-body');
        var cancelBtn = document.getElementById('btn-share-teams-cancel');
        var saveBtn = document.getElementById('btn-share-teams-save');

        if (titleEl) titleEl.textContent = 'Compartir — ' + resourceName;
        if (cancelBtn) cancelBtn.textContent = (typeof t === 'function' ? t('common.actions.cancel') : null) || 'Cancelar';
        if (saveBtn) saveBtn.textContent = (typeof t === 'function' ? t('teams.teams.sharing.save') : null) || 'Guardar';
        if (bodyEl) bodyEl.innerHTML = '<p class="admin-empty" style="padding:20px 14px">Cargando…</p>';
        if (modal) modal.style.display = '';

        try {
            var results = await Promise.all([
                api.get('/api/teams/'),
                api.get('/api/sharing/' + resourceType + '/' + resourceId),
            ]);
            _userTeams = results[0];
            _originalShared = results[1].map(function (s) { return s.team_id; });

            if (!_userTeams.length) {
                if (bodyEl) bodyEl.innerHTML = '<p class="admin-empty" style="padding:20px 14px">' +
                    esc((typeof t === 'function' ? t('teams.teams.sharing.no_teams') : null) || 'No perteneces a ningún equipo.') + '</p>';
                return;
            }

            var rows = _userTeams.map(function (team) {
                var checked = _originalShared.indexOf(team.id) !== -1;
                var letter = esc((team.name || '?').charAt(0).toUpperCase());
                var color = _teamColor(team.name || '');
                var managerLabel = (typeof t === 'function' ? t('teams.teams.manager_badge') : null) || 'Gestor';
                var memberLabel = (typeof t === 'function' ? t('teams.teams.member_badge') : null) || 'Miembro';
                var roleBadge = team.is_manager
                    ? '<span class="badge badge--ok">' + esc(managerLabel) + '</span>'
                    : '<span class="badge badge--std">' + esc(memberLabel) + '</span>';
                return '<label class="share-team-row">' +
                    '<input type="checkbox" class="share-team-chk" value="' + esc(team.id) + '"' + (checked ? ' checked' : '') + '>' +
                    '<span class="share-team-avatar" style="background:' + color + '">' + letter + '</span>' +
                    '<span class="share-team-name">' + esc(team.name) + '</span>' +
                    roleBadge +
                    '</label>';
            }).join('');

            if (bodyEl) bodyEl.innerHTML = '<div class="share-team-list">' + rows + '</div>';
        } catch (e) {
            if (bodyEl) bodyEl.innerHTML = '<p class="admin-empty" style="padding:20px 14px">Error: ' + esc(e.message) + '</p>';
        }
    }

    async function _save() {
        var saveBtn = document.getElementById('btn-share-teams-save');
        if (saveBtn) saveBtn.disabled = true;
        try {
            var chks = document.querySelectorAll('#share-teams-body .share-team-chk');
            var newShared = Array.from(chks).filter(function (c) { return c.checked; }).map(function (c) { return c.value; });
            var toAdd = newShared.filter(function (id) { return _originalShared.indexOf(id) === -1; });
            var toRemove = _originalShared.filter(function (id) { return newShared.indexOf(id) === -1; });

            var promises = toAdd.map(function (teamId) {
                return api.post('/api/sharing/' + _resourceType + '/' + _resourceId, { team_id: teamId });
            }).concat(toRemove.map(function (teamId) {
                return api.del('/api/sharing/' + _resourceType + '/' + _resourceId + '/' + teamId);
            }));

            await Promise.all(promises);
            if (typeof toast === 'function') toast('Guardado ✓', 'success');
            _close();
        } catch (e) {
            if (typeof toast === 'function') toast(e.message || 'Error', 'error');
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    window.shareTeams = { open: open };
}());

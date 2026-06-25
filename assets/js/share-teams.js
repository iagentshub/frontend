// share-teams.js — modal para compartir recursos con grupos de workspace
'use strict';

(function () {
    var _resourceType = null;
    var _resourceId   = null;
    var _resourceName = null;
    var _sharedGroups = new Set();
    var _allGroups    = [];
    var _workspaceId  = null;

    var _PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777'];

    function _groupColor(name) {
        var c = 0;
        for (var i = 0; i < (name || '').length; i++) c += name.charCodeAt(i);
        return _PALETTE[c % _PALETTE.length];
    }

    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function _injectStyles() {
        if (document.getElementById('share-groups-styles')) return;
        var s = document.createElement('style');
        s.id = 'share-groups-styles';
        s.textContent =
            '.share-groups-table { width:100%; border-collapse:collapse; }' +
            '.share-groups-table thead th { font-size:11px; font-weight:600; text-transform:uppercase;' +
            '  letter-spacing:.05em; color:var(--ink-3); padding:0 14px 8px; text-align:left; }' +
            '.share-groups-table tbody tr { border-top:1px solid var(--line); }' +
            '.share-groups-table tbody tr:first-child { border-top:1px solid var(--line-strong); }' +
            '.share-groups-table tbody td { padding:10px 14px; vertical-align:middle; }' +
            '.share-groups-table td:last-child { text-align:right; width:1%; white-space:nowrap; }' +
            '.share-group-cell { display:flex; align-items:center; gap:9px; }' +
            '.share-group-avatar { flex-shrink:0; width:28px; height:28px; border-radius:7px;' +
            '  display:flex; align-items:center; justify-content:center;' +
            '  font-size:12px; font-weight:700; color:#fff; }' +
            '.share-group-name { font-size:13px; font-weight:500; color:var(--ink);' +
            '  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }' +
            '.share-revoke-btn { display:inline-flex; align-items:center; gap:4px;' +
            '  padding:4px 10px; border-radius:var(--radius); border:1px solid color-mix(in srgb,var(--danger) 30%,transparent);' +
            '  background:color-mix(in srgb,var(--danger) 7%,transparent); color:var(--danger);' +
            '  font-size:12px; font-weight:500; font-family:var(--font); cursor:pointer; white-space:nowrap;' +
            '  transition:background .1s; }' +
            '.share-revoke-btn:hover { background:color-mix(in srgb,var(--danger) 13%,transparent); }' +
            '.share-revoke-btn:disabled,.share-grant-btn:disabled { opacity:.4; pointer-events:none; }' +
            '.share-grant-btn { display:inline-flex; align-items:center; gap:4px;' +
            '  padding:4px 10px; border-radius:var(--radius); border:1px solid color-mix(in srgb,#059669 30%,transparent);' +
            '  background:color-mix(in srgb,#059669 10%,transparent); color:#059669;' +
            '  font-size:12px; font-weight:500; font-family:var(--font); cursor:pointer; white-space:nowrap;' +
            '  transition:background .1s; }' +
            '.share-grant-btn:hover { background:color-mix(in srgb,#059669 18%,transparent); }';
        document.head.appendChild(s);
    }

    function _ensureModal() {
        if (document.getElementById('modal-share-teams')) return;
        _injectStyles();
        var div = document.createElement('div');
        div.innerHTML =
            '<div id="modal-share-teams" class="modal-bg" style="display:none">' +
            '<div class="modal-box" style="max-width:500px">' +
            '<div class="modal-header">' +
            '<h3 class="modal-title" id="share-teams-title"></h3>' +
            '<button class="modal-close" id="btn-share-teams-close">' +
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            '</button>' +
            '</div>' +
            '<div class="modal-body" id="share-teams-body" style="padding:16px 0 4px;gap:0;overflow-x:auto"></div>' +
            '<div class="modal-footer" style="justify-content:flex-end">' +
            '<button class="btn btn-ghost" id="btn-share-teams-done">Cerrar</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(div.firstElementChild);

        document.getElementById('btn-share-teams-close').addEventListener('click', _close);
        document.getElementById('btn-share-teams-done').addEventListener('click', _close);
        document.getElementById('modal-share-teams').addEventListener('click', function (e) {
            if (e.target === this) _close();
        });
        document.getElementById('share-teams-body').addEventListener('click', _onToggle);
    }

    function _close() {
        var modal = document.getElementById('modal-share-teams');
        if (modal) modal.style.display = 'none';
    }

    function _buildBtn(groupId) {
        var shared = _sharedGroups.has(groupId);
        if (shared) {
            return '<button class="share-revoke-btn" data-group="' + esc(groupId) + '">' +
                '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
                'Quitar acceso</button>';
        }
        return '<button class="share-grant-btn" data-group="' + esc(groupId) + '">' +
            '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            'Dar acceso</button>';
    }

    function _renderTable() {
        var bodyEl = document.getElementById('share-teams-body');
        if (!bodyEl) return;

        if (!_allGroups.length) {
            bodyEl.innerHTML =
                '<p style="padding:24px 16px;text-align:center;font-size:13px;color:var(--ink-3)">' +
                'Este workspace no tiene grupos. Crea uno en Perfil &rarr; Workspaces.' +
                '</p>';
            return;
        }

        var rows = _allGroups.map(function (group) {
            var letter = (group.name || '?').charAt(0).toUpperCase();
            var color  = _groupColor(group.name || '');
            var members = group.member_count != null ? group.member_count + ' miembros' : '';
            return '<tr>' +
                '<td><div class="share-group-cell">' +
                '<span class="share-group-avatar" style="background:' + color + '">' + esc(letter) + '</span>' +
                '<span class="share-group-name">' + esc(group.name) + '</span>' +
                '</div></td>' +
                '<td style="font-size:12px;color:var(--ink-3)">' + esc(members) + '</td>' +
                '<td>' + _buildBtn(group.id) + '</td>' +
                '</tr>';
        }).join('');

        bodyEl.innerHTML =
            '<table class="share-groups-table">' +
            '<thead><tr>' +
            '<th>Grupo</th>' +
            '<th>Miembros</th>' +
            '<th></th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '</table>';
    }

    async function _onToggle(e) {
        var btn = e.target.closest('.share-grant-btn,.share-revoke-btn');
        if (!btn) return;
        var groupId  = btn.dataset.group;
        var isRevoke = btn.classList.contains('share-revoke-btn');

        btn.disabled = true;
        try {
            if (isRevoke) {
                await api.del('/api/sharing/' + _resourceType + '/' + _resourceId + '/' + groupId);
                _sharedGroups.delete(groupId);
            } else {
                await api.post('/api/sharing/' + _resourceType + '/' + _resourceId, { group_id: groupId });
                _sharedGroups.add(groupId);
            }
            btn.outerHTML = _buildBtn(groupId);
        } catch (err) {
            btn.disabled = false;
            if (typeof toast === 'function') toast(err.detail || err.message || 'Error', 'error');
        }
    }

    async function open(resourceType, resourceId, resourceName) {
        _ensureModal();
        _resourceType = resourceType;
        _resourceId   = resourceId;
        _resourceName = resourceName;
        _sharedGroups = new Set();
        _allGroups    = [];

        var modal   = document.getElementById('modal-share-teams');
        var titleEl = document.getElementById('share-teams-title');
        var bodyEl  = document.getElementById('share-teams-body');

        if (titleEl) titleEl.textContent = 'Compartir — ' + resourceName;
        if (bodyEl) bodyEl.innerHTML =
            '<p style="padding:24px 16px;text-align:center;font-size:13px;color:var(--ink-3)">Cargando…</p>';
        if (modal) modal.style.display = '';

        try {
            // Get current workspace_id from /api/auth/me
            var me = await api.get('/api/auth/me');
            _workspaceId = me.workspace_id || me.username;

            var results = await Promise.all([
                api.get('/api/workspaces/' + _workspaceId + '/groups'),
                api.get('/api/sharing/' + resourceType + '/' + resourceId),
            ]);
            _allGroups    = results[0] || [];
            _sharedGroups = new Set((results[1] || []).map(function (s) { return s.group_id; }));
            _renderTable();
        } catch (e) {
            if (bodyEl) bodyEl.innerHTML =
                '<p style="padding:24px 16px;text-align:center;font-size:13px;color:var(--danger)">' + esc(e.message || String(e)) + '</p>';
        }
    }

    window.shareTeams = { open: open };
}());

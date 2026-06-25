(function () {
    'use strict';

    var _workspaces    = [];
    var _myInvitations = [];
    var _currentWs     = null;
    var _currentMembers = [];
    var _currentPending = [];
    var _currentGroups  = [];
    var _canManage     = false;
    var _modalTab      = 'members'; // 'members' | 'groups'

    // ── Helpers ────────────────────────────────────────────────────────────────

    function _fmtDate(iso) {
        if (!iso) return '';
        return iso.slice(0, 10);
    }

    function _roleLabel(role) {
        return role === 'owner' ? 'Propietario' : role === 'admin' ? 'Admin' : 'Miembro';
    }

    // ── Load ───────────────────────────────────────────────────────────────────

    function load() {
        Promise.all([
            api.get('/api/workspaces').catch(function () { return []; }),
            api.get('/api/workspaces/my-invitations').catch(function () { return []; }),
        ]).then(function (results) {
            _workspaces    = results[0] || [];
            _myInvitations = results[1] || [];
            _renderMine();
            _renderInvitations();
            _updateInvBadge();
        });
    }

    // ── Tab switching ──────────────────────────────────────────────────────────

    function _bindTabs() {
        var tabs = document.querySelectorAll('[data-ws-tab]');
        tabs.forEach(function (btn) {
            btn.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                btn.classList.add('active');
                var tab = btn.getAttribute('data-ws-tab');
                document.getElementById('ws-panel-mine').style.display = tab === 'mine' ? '' : 'none';
                document.getElementById('ws-panel-invitations').style.display = tab === 'invitations' ? '' : 'none';
            });
        });
    }

    // ── "Mis workspaces" panel ─────────────────────────────────────────────────

    function _renderMine() {
        var wrap = document.getElementById('ws-list-wrap');
        if (!wrap) return;
        var teams = _workspaces.filter(function (w) { return w.type === 'team'; });
        if (!teams.length) {
            wrap.innerHTML = '<p class="profile-empty-msg">No perteneces a ningún workspace de equipo.</p>';
            return;
        }
        wrap.innerHTML = teams.map(function (ws) {
            var canManage = ws.role === 'owner' || ws.role === 'admin';
            return '<div class="profile-ws-card">' +
                '<div class="profile-ws-info">' +
                '<span class="profile-ws-name">' + esc(ws.name) + '</span>' +
                '<span class="profile-ws-role">' + esc(_roleLabel(ws.role)) + '</span>' +
                '</div>' +
                (canManage
                    ? '<button class="btn btn-ghost btn-sm" data-ws-manage="' + esc(ws.id) + '">Gestionar</button>'
                    : '') +
                '</div>';
        }).join('');

        wrap.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-ws-manage]');
            if (btn) { _openMembersModal(btn.getAttribute('data-ws-manage')); }
        });
    }

    // ── Members modal ──────────────────────────────────────────────────────────

    function _openMembersModal(wsId) {
        _currentWs = _workspaces.find(function (w) { return w.id === wsId; }) || null;
        if (!_currentWs) return;
        _canManage = _currentWs.role === 'owner' || _currentWs.role === 'admin';
        _modalTab  = 'members';

        document.getElementById('ws-members-modal-title').textContent = _currentWs.name;
        document.getElementById('ws-invite-section').style.display = _canManage ? '' : 'none';
        document.getElementById('ws-pending-section').style.display = _canManage ? '' : 'none';
        document.getElementById('ws-invite-username').value = '';

        // Show modal tabs
        var tabMembersBtn = document.getElementById('ws-modal-tab-members');
        var tabGroupsBtn  = document.getElementById('ws-modal-tab-groups');
        if (tabMembersBtn) tabMembersBtn.classList.add('active');
        if (tabGroupsBtn)  tabGroupsBtn.classList.remove('active');
        var panelMembers = document.getElementById('ws-modal-panel-members');
        var panelGroups  = document.getElementById('ws-modal-panel-groups');
        if (panelMembers) panelMembers.style.display = '';
        if (panelGroups)  panelGroups.style.display  = 'none';

        _reloadModalData();
        document.getElementById('modal-ws-members').style.display = '';
    }

    function _reloadModalData() {
        if (!_currentWs) return;
        var wsId = _currentWs.id;
        Promise.all([
            api.get('/api/workspaces/' + wsId + '/members').catch(function () { return []; }),
            _canManage
                ? api.get('/api/workspaces/' + wsId + '/invitations').catch(function () { return []; })
                : Promise.resolve([]),
            api.get('/api/workspaces/' + wsId + '/groups').catch(function () { return []; }),
        ]).then(function (results) {
            _currentMembers = results[0] || [];
            _currentPending = results[1] || [];
            _currentGroups  = results[2] || [];
            _renderModalMembers();
            _renderModalPending();
            _renderModalGroups();
        });
    }

    function _closeModal() {
        document.getElementById('modal-ws-members').style.display = 'none';
        _currentWs = null;
    }

    function _renderModalMembers() {
        var el = document.getElementById('ws-members-list');
        if (!el) return;
        if (!_currentMembers.length) {
            el.innerHTML = '<p class="profile-empty-msg">Sin miembros.</p>';
            return;
        }
        el.innerHTML = '<table class="admin-table" style="width:100%"><thead><tr>' +
            '<th>Usuario</th><th>Rol</th><th>Desde</th>' + (_canManage ? '<th></th>' : '') + '</tr></thead><tbody>' +
            _currentMembers.map(function (m) {
                var isOwner = m.role === 'owner';
                var removeBtn = (_canManage && !isOwner)
                    ? '<button class="btn btn-ghost btn-sm btn-danger-hover" data-remove-member="' + esc(m.username) + '">Quitar</button>'
                    : '';
                return '<tr>' +
                    '<td>' + esc(m.display_name || m.username) + '</td>' +
                    '<td><span class="status-badge">' + esc(_roleLabel(m.role)) + '</span></td>' +
                    '<td style="color:var(--ink-3);font-size:0.78rem">' + esc(_fmtDate(m.joined_at)) + '</td>' +
                    (_canManage ? '<td>' + removeBtn + '</td>' : '') +
                    '</tr>';
            }).join('') +
            '</tbody></table>';

        el.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-remove-member]');
            if (!btn || !_currentWs) return;
            var uname = btn.getAttribute('data-remove-member');
            if (!confirm('Quitar a ' + uname + ' del workspace?')) return;
            api.delete('/api/workspaces/' + _currentWs.id + '/members/' + encodeURIComponent(uname))
                .then(function () {
                    toast('Miembro eliminado', 'success');
                    _reloadModalData();
                })
                .catch(function (err) { toast(err.detail || 'Error', 'error'); });
        });
    }

    function _renderModalPending() {
        var el = document.getElementById('ws-pending-list');
        if (!el) return;
        if (!_currentPending.length) {
            el.innerHTML = '<p class="profile-empty-msg" style="color:var(--ink-3);font-size:0.82rem">Sin invitaciones pendientes.</p>';
            return;
        }
        el.innerHTML = _currentPending.map(function (inv) {
            return '<div class="ws-inv-row">' +
                '<span class="ws-inv-username">' + esc(inv.username) + '</span>' +
                '<button class="btn btn-ghost btn-sm btn-danger-hover" data-cancel-inv="' + esc(inv.id) + '">Cancelar</button>' +
                '</div>';
        }).join('');

        el.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-cancel-inv]');
            if (!btn || !_currentWs) return;
            var invId = btn.getAttribute('data-cancel-inv');
            api.delete('/api/workspaces/' + _currentWs.id + '/invitations/' + invId)
                .then(function () {
                    toast('Invitacion cancelada', 'success');
                    _reloadModalData();
                })
                .catch(function (err) { toast(err.detail || 'Error', 'error'); });
        });
    }

    // ── Groups panel inside modal ──────────────────────────────────────────────

    function _renderModalGroups() {
        var el = document.getElementById('ws-groups-list');
        if (!el) return;
        var newGroupBtn = document.getElementById('ws-new-group-row');

        if (!_canManage && !_currentGroups.length) {
            el.innerHTML = '<p class="profile-empty-msg">Sin grupos.</p>';
            return;
        }

        var rows = _currentGroups.map(function (g) {
            var memberCount = g.member_count != null ? g.member_count + ' miembros' : '';
            return '<div class="ws-group-row" data-group-id="' + esc(g.id) + '" data-group-name="' + esc(g.name) + '">' +
                '<div class="ws-group-info">' +
                '<span class="ws-group-name">' + esc(g.name) + '</span>' +
                '<span class="ws-group-count">' + esc(memberCount) + '</span>' +
                '</div>' +
                '<div class="ws-group-actions">' +
                '<button class="btn btn-ghost btn-sm" data-group-members="' + esc(g.id) + '">Miembros</button>' +
                (_canManage
                    ? '<button class="btn btn-ghost btn-sm btn-danger-hover" data-group-delete="' + esc(g.id) + '">Eliminar</button>'
                    : '') +
                '</div>' +
                '</div>';
        }).join('');

        el.innerHTML = rows || '<p class="profile-empty-msg">Sin grupos todavia.</p>';

        el.addEventListener('click', function (e) {
            var membersBtn = e.target.closest('[data-group-members]');
            var deleteBtn  = e.target.closest('[data-group-delete]');
            if (membersBtn) { _openGroupMembersPanel(membersBtn.getAttribute('data-group-members')); }
            if (deleteBtn && _currentWs) {
                var gid = deleteBtn.getAttribute('data-group-delete');
                var row = deleteBtn.closest('.ws-group-row');
                var gname = row ? row.getAttribute('data-group-name') : gid;
                if (!confirm('Eliminar grupo "' + gname + '"?')) return;
                api.delete('/api/workspaces/' + _currentWs.id + '/groups/' + gid)
                    .then(function () {
                        toast('Grupo eliminado', 'success');
                        _reloadModalData();
                    })
                    .catch(function (err) { toast(err.detail || 'Error', 'error'); });
            }
        });

        if (newGroupBtn) newGroupBtn.style.display = _canManage ? '' : 'none';
    }

    function _openGroupMembersPanel(groupId) {
        if (!_currentWs) return;
        var group = _currentGroups.find(function (g) { return g.id === groupId; });
        if (!group) return;

        var wsMembers = _currentMembers.map(function (m) { return m.username; });

        api.get('/api/workspaces/' + _currentWs.id + '/groups/' + groupId + '/members')
            .then(function (members) {
                var memberSet = new Set(members.map(function (m) { return m.username; }));
                var html = '<div style="margin-bottom:10px"><strong>' + esc(group.name) + '</strong> — miembros del grupo</div>';

                if (_canManage) {
                    // Show all workspace members with add/remove toggle
                    html += _currentMembers.map(function (wm) {
                        var inGroup = memberSet.has(wm.username);
                        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line)">' +
                            '<span>' + esc(wm.display_name || wm.username) + '</span>' +
                            (inGroup
                                ? '<button class="btn btn-ghost btn-sm btn-danger-hover" data-grp-remove="' + esc(groupId) + '" data-grp-user="' + esc(wm.username) + '">Quitar</button>'
                                : '<button class="btn btn-ghost btn-sm" data-grp-add="' + esc(groupId) + '" data-grp-user="' + esc(wm.username) + '">Agregar</button>') +
                            '</div>';
                    }).join('');
                } else {
                    html += members.map(function (m) {
                        return '<div style="padding:6px 0;border-bottom:1px solid var(--line)">' + esc(m.display_name || m.username) + '</div>';
                    }).join('') || '<p class="profile-empty-msg">Sin miembros en este grupo.</p>';
                }

                // Replace groups list content temporarily
                var el = document.getElementById('ws-groups-list');
                if (!el) return;
                el.innerHTML = '<button class="btn btn-ghost btn-sm" id="btn-back-groups" style="margin-bottom:12px">← Volver</button>' + html;

                document.getElementById('btn-back-groups').addEventListener('click', function () {
                    _renderModalGroups();
                });

                el.addEventListener('click', function (e) {
                    var addBtn = e.target.closest('[data-grp-add]');
                    var remBtn = e.target.closest('[data-grp-remove]');
                    if (addBtn && _currentWs) {
                        var uname = addBtn.getAttribute('data-grp-user');
                        var gid   = addBtn.getAttribute('data-grp-add');
                        api.post('/api/workspaces/' + _currentWs.id + '/groups/' + gid + '/members', { username: uname })
                            .then(function () { _openGroupMembersPanel(gid); })
                            .catch(function (err) { toast(err.detail || 'Error', 'error'); });
                    }
                    if (remBtn && _currentWs) {
                        var uname = remBtn.getAttribute('data-grp-user');
                        var gid   = remBtn.getAttribute('data-grp-remove');
                        api.delete('/api/workspaces/' + _currentWs.id + '/groups/' + gid + '/members/' + encodeURIComponent(uname))
                            .then(function () { _openGroupMembersPanel(gid); })
                            .catch(function (err) { toast(err.detail || 'Error', 'error'); });
                    }
                });
            })
            .catch(function (err) { toast(err.detail || 'Error', 'error'); });
    }

    function _bindNewGroupBtn() {
        var btn   = document.getElementById('btn-ws-new-group');
        var input = document.getElementById('ws-new-group-name');
        if (!btn || !input) return;
        btn.addEventListener('click', function () {
            var name = (input.value || '').trim();
            if (!name || !_currentWs) return;
            btn.disabled = true;
            api.post('/api/workspaces/' + _currentWs.id + '/groups', { name: name })
                .then(function () {
                    input.value = '';
                    toast('Grupo creado', 'success');
                    _reloadModalData();
                })
                .catch(function (err) { toast(err.detail || 'Error al crear grupo', 'error'); })
                .finally(function () { btn.disabled = false; });
        });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
    }

    function _bindModalTabs() {
        var tabM = document.getElementById('ws-modal-tab-members');
        var tabG = document.getElementById('ws-modal-tab-groups');
        var panM = document.getElementById('ws-modal-panel-members');
        var panG = document.getElementById('ws-modal-panel-groups');
        if (!tabM || !tabG) return;
        tabM.addEventListener('click', function () {
            tabM.classList.add('active');    tabG.classList.remove('active');
            if (panM) panM.style.display = ''; if (panG) panG.style.display = 'none';
            _modalTab = 'members';
        });
        tabG.addEventListener('click', function () {
            tabG.classList.add('active');    tabM.classList.remove('active');
            if (panG) panG.style.display = ''; if (panM) panM.style.display = 'none';
            _modalTab = 'groups';
        });
    }

    function _bindInviteBtn() {
        var btn = document.getElementById('btn-ws-invite');
        var input = document.getElementById('ws-invite-username');
        if (!btn || !input) return;
        btn.addEventListener('click', function () {
            var uname = (input.value || '').trim().toLowerCase();
            if (!uname || !_currentWs) return;
            btn.disabled = true;
            api.post('/api/workspaces/' + _currentWs.id + '/invitations', { username: uname })
                .then(function (inv) {
                    _currentPending.unshift(inv);
                    _renderModalPending();
                    input.value = '';
                    toast('Invitacion enviada a ' + uname, 'success');
                })
                .catch(function (err) { toast(err.detail || 'Error al invitar', 'error'); })
                .finally(function () { btn.disabled = false; });
        });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
    }

    // ── "Invitaciones" panel ───────────────────────────────────────────────────

    function _updateInvBadge() {
        var badge = document.getElementById('ws-inv-badge');
        if (!badge) return;
        var n = _myInvitations.length;
        badge.textContent = n;
        badge.style.display = n > 0 ? '' : 'none';
    }

    function _renderInvitations() {
        var wrap = document.getElementById('ws-inv-wrap');
        if (!wrap) return;
        if (!_myInvitations.length) {
            wrap.innerHTML = '<p class="profile-empty-msg">No tienes invitaciones pendientes.</p>';
            return;
        }
        wrap.innerHTML = _myInvitations.map(function (inv) {
            return '<div class="ws-inv-received-card" data-inv-id="' + esc(inv.id) + '">' +
                '<div class="ws-inv-info">' +
                '<span class="ws-inv-ws-name">' + esc(inv.workspace_name || inv.workspace_id) + '</span>' +
                '<span class="ws-inv-from">Invitado por <strong>' + esc(inv.invited_by) + '</strong></span>' +
                '</div>' +
                '<div class="ws-inv-actions">' +
                '<button class="btn btn-primary btn-sm" data-inv-accept="' + esc(inv.id) + '">Aceptar</button>' +
                '<button class="btn btn-ghost btn-sm" data-inv-reject="' + esc(inv.id) + '">Rechazar</button>' +
                '</div>' +
                '</div>';
        }).join('');

        wrap.addEventListener('click', function (e) {
            var accept = e.target.closest('[data-inv-accept]');
            var reject = e.target.closest('[data-inv-reject]');
            if (accept) {
                var id = accept.getAttribute('data-inv-accept');
                api.post('/api/workspaces/invitations/' + id + '/accept', {})
                    .then(function () {
                        _myInvitations = _myInvitations.filter(function (i) { return i.id !== id; });
                        _renderInvitations();
                        _updateInvBadge();
                        api.get('/api/workspaces').then(function (ws) {
                            _workspaces = ws;
                            _renderMine();
                        });
                        toast('Te has unido al workspace', 'success');
                    })
                    .catch(function (err) { toast(err.detail || 'Error', 'error'); });
            }
            if (reject) {
                var id = reject.getAttribute('data-inv-reject');
                api.post('/api/workspaces/invitations/' + id + '/reject', {})
                    .then(function () {
                        _myInvitations = _myInvitations.filter(function (i) { return i.id !== id; });
                        _renderInvitations();
                        _updateInvBadge();
                    })
                    .catch(function (err) { toast(err.detail || 'Error', 'error'); });
            }
        });
    }

    // ── Init ───────────────────────────────────────────────────────────────────

    function init() {
        _bindTabs();
        _bindInviteBtn();
        _bindNewGroupBtn();
        _bindModalTabs();

        var closeBtn = document.getElementById('btn-ws-members-close');
        if (closeBtn) { closeBtn.addEventListener('click', _closeModal); }
        var modalBg = document.getElementById('modal-ws-members');
        if (modalBg) {
            modalBg.addEventListener('click', function (e) {
                if (e.target === modalBg) { _closeModal(); }
            });
        }

        var navBtn = document.getElementById('nav-workspaces');
        if (navBtn) {
            navBtn.addEventListener('click', function () { load(); });
        }
    }

    document.addEventListener('DOMContentLoaded', init);
}());

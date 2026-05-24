'use strict';

var _profileTeamsLoaded = false;
var _activeTeamsTab = 'my-teams';
var _profileUsername = '';
var _profileIsGuest = false;
var _teamsCache = [];

function loadTeamsSection() {
    if (_profileTeamsLoaded) return;
    _profileTeamsLoaded = true;
    _bindTeamsTabs();
    _bindCreateTeam();
    _bindMembersModal();
    _bindDirectoryModal();
    _loadAll();
    _checkInvitationToken();
}

async function _loadAll() {
    try {
        if (!_profileUsername) {
            var me = await api.get('/api/auth/me');
            _profileUsername = me.username || '';
            _profileIsGuest = me.auth_method === 'guest';
        }
        var results = await Promise.all([
            api.get('/api/teams/'),
            api.get('/api/teams/invitations/received'),
            api.get('/api/teams/invitations/sent'),
        ]);
        _renderMyTeams(results[0]);
        _renderInvitationsTab(results[1], results[2]);
        _applyGuestRestrictions();
    } catch (e) {
        var wrap = document.getElementById('teams-list-wrap');
        if (wrap) wrap.innerHTML = '<p class="admin-empty">Error al cargar equipos.</p>';
    }
}

// ── Mis equipos ────────────────────────────────────────────────────────────────

function _renderMyTeams(teams) {
    _teamsCache = teams;
    var wrap = document.getElementById('teams-list-wrap');
    if (!wrap) return;

    if (!teams.length) {
        wrap.innerHTML = '<p class="admin-empty">' + t('teams.teams.no_teams') + '</p>';
        return;
    }

    var rows = teams.map(function (team) {
        var isManager = team.is_manager;
        var badge = isManager
            ? '<span class="badge badge--ok">' + t('teams.teams.manager_badge') + '</span>'
            : '<span class="badge badge--std">' + t('teams.teams.member_badge') + '</span>';
        var date = team.created_at
            ? new Date(team.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        var actions =
            '<div class="admin-actions-menu">' +
            '<button class="btn-actions">⋮</button>' +
            '<div class="actions-dropdown" style="display:none">' +
            (isManager ? '<button class="action-item" data-team-action="manage-members" data-team-id="' + esc(team.id) + '" data-team-name="' + esc(team.name) + '">' + t('teams.teams.actions.manage_members') + '</button>' : '') +
            (isManager ? '<button class="action-item" data-team-action="invite" data-team-id="' + esc(team.id) + '">' + t('teams.teams.actions.invite') + '</button>' : '') +
            '<button class="action-item" data-team-action="directory" data-team-id="' + esc(team.id) + '" data-team-name="' + esc(team.name) + '">' + t('teams.teams.actions.directory') + '</button>' +
            '<button class="action-item action-item--danger" data-team-action="leave" data-team-id="' + esc(team.id) + '" data-team-name="' + esc(team.name) + '">' + t('teams.teams.leave') + '</button>' +
            '</div></div>';
        return '<tr>' +
            '<td>' + esc(team.name) + '</td>' +
            '<td>' + esc(team.created_by || '—') + '</td>' +
            '<td class="td-date">' + date + '</td>' +
            '<td>' + badge + '</td>' +
            '<td class="td-actions">' + actions + '</td>' +
            '</tr>';
    }).join('');

    var _searchSvg = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    wrap.innerHTML =
        '<div class="admin-toolbar"><div class="admin-search-wrap"><span class="search-icon">' + _searchSvg + '</span><input class="admin-search" id="teams-table-filter" placeholder="' + esc(t('teams.teams.table.filter_placeholder') || 'Filtrar…') + '" /></div></div>' +
        '<table class="admin-table"><thead><tr>' +
        '<th>' + t('teams.teams.table.col_name') + '</th>' +
        '<th>' + t('teams.teams.table.col_creator') + '</th>' +
        '<th>' + t('teams.teams.table.col_date') + '</th>' +
        '<th>' + t('teams.teams.table.col_role') + '</th>' +
        '<th></th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>';

    var filterInput = wrap.querySelector('#teams-table-filter');
    var tbody = wrap.querySelector('tbody');
    if (filterInput) {
        filterInput.addEventListener('input', function () {
            var q = filterInput.value.toLowerCase();
            tbody.querySelectorAll('tr').forEach(function (row) {
                var cells = row.querySelectorAll('td');
                var name = cells[0] ? cells[0].textContent.toLowerCase() : '';
                var creator = cells[1] ? cells[1].textContent.toLowerCase() : '';
                row.style.display = !q || name.includes(q) || creator.includes(q) ? '' : 'none';
            });
        });
    }

    wrap.addEventListener('click', function (e) {
        var allDropdowns = wrap.querySelectorAll('.actions-dropdown');
        var btn = e.target.closest('.btn-actions');
        if (btn) {
            var menu = btn.nextElementSibling;
            var isOpen = menu.style.display !== 'none';
            allDropdowns.forEach(function (d) { d.style.display = 'none'; });
            if (!isOpen) menu.style.display = '';
            e.stopPropagation();
            return;
        }
        if (!e.target.closest('.admin-actions-menu')) {
            allDropdowns.forEach(function (d) { d.style.display = 'none'; });
        }
        var item = e.target.closest('[data-team-action]');
        if (!item) return;
        allDropdowns.forEach(function (d) { d.style.display = 'none'; });
        _handleTeamAction(item.dataset.teamAction, item.dataset.teamId, item.dataset.teamName || '');
    });
}

async function _handleTeamAction(action, teamId, teamName) {
    var team = _teamsCache.find(function (t) { return t.id === teamId; }) || {};
    if (action === 'manage-members') {
        await _openMembersModal(teamId, teamName, !!team.is_manager);
    } else if (action === 'invite') {
        var email = prompt(t('teams.teams.card.invite_member') + ':');
        if (!email || !email.trim()) return;
        try {
            await api.post('/api/teams/' + teamId + '/invitations', { email: email.trim().toLowerCase() });
            toast(t('teams.teams.actions.invite') + ' ✓', 'success');
        } catch (err) { toast(err.message || 'Error', 'error'); }
    } else if (action === 'directory') {
        await _openDirectoryModal(teamId, teamName);
    } else if (action === 'leave') {
        var msg = (t('teams.teams.actions.leave_confirm') || '¿Salir del equipo {{name}}?').replace('{{name}}', teamName);
        if (!confirm(msg)) return;
        try {
            await api.del('/api/teams/' + teamId + '/members/' + encodeURIComponent(_profileUsername));
            toast(t('teams.teams.leave') + ' ✓', 'success');
            _profileTeamsLoaded = false;
            _allMembersCache = {};
            loadTeamsSection();
        } catch (err) { toast(err.message || 'Error', 'error'); }
    }
}

// Cache members per team for the permissions modal
var _allMembersCache = {};

async function _loadManagerResources(teamId) {
    if (_managerResources._loadedFor === teamId) return;
    var members = [];
    try { members = await api.get('/api/teams/' + teamId + '/members'); } catch (e) {}
    _allMembersCache[teamId] = members;

    var results = await Promise.all([
        api.get('/api/agents?scope=all').catch(function () { return []; }),
        api.get('/api/connections').catch(function () { return []; }),
        api.get('/api/knowledge').catch(function () { return []; }),
    ]);
    _managerResources.agents = results[0].map(function (a) { return { id: a.id, name: a.name }; });
    _managerResources.connections = results[1].map(function (c) { return { id: c.id, name: c.name || c.label || c.id }; });
    _managerResources.knowledge = results[2].map(function (k) { return { id: k.id, title: k.title }; });
    _managerResources._loadedFor = teamId;

    var btnSave = document.getElementById('btn-perms-save');
    if (btnSave && !btnSave._profilePatched) {
        btnSave._profilePatched = true;
        btnSave.addEventListener('click', function () {
            setTimeout(function () {
                _profileTeamsLoaded = false;
                _allMembersCache = {};
                _managerResources._loadedFor = null;
                loadTeamsSection();
            }, 300);
        });
    }
}

async function _openMembersModal(teamId, teamName, isManager) {
    _managerTeamId = teamId;
    await _loadManagerResources(teamId);
    _allMembers = _allMembersCache[teamId] || [];

    var titleEl = document.getElementById('members-modal-title');
    if (titleEl) titleEl.textContent = teamName;

    var inviteBtn = document.getElementById('btn-members-invite');
    if (inviteBtn) {
        inviteBtn.style.display = isManager ? '' : 'none';
        inviteBtn.onclick = async function () {
            var email = prompt(t('teams.teams.card.invite_member') + ':');
            if (!email || !email.trim()) return;
            try {
                await api.post('/api/teams/' + teamId + '/invitations', { email: email.trim().toLowerCase() });
                toast(t('teams.teams.actions.invite') + ' ✓', 'success');
            } catch (err) { toast(err.message || 'Error', 'error'); }
        };
    }

    renderMembers(_allMembers);

    var filterInput = document.getElementById('members-modal-filter');
    if (filterInput) {
        filterInput.value = '';
        filterInput.oninput = function () {
            var q = filterInput.value.toLowerCase();
            var tbody = document.querySelector('#members-table-wrap tbody');
            if (!tbody) return;
            tbody.querySelectorAll('tr').forEach(function (row) {
                var cell = row.querySelector('td');
                var text = cell ? cell.textContent.toLowerCase() : '';
                row.style.display = !q || text.includes(q) ? '' : 'none';
            });
        };
    }

    var modal = document.getElementById('modal-members');
    if (modal) modal.style.display = '';
}

async function _openDirectoryModal(teamId, teamName) {
    var modal = document.getElementById('modal-directory');
    var titleEl = document.getElementById('directory-modal-title');
    var wrap = document.getElementById('directory-modal-wrap');
    if (!modal || !wrap) return;

    if (titleEl) titleEl.textContent = (t('teams.teams.modal_directory.title') || 'Directorio de {{name}}').replace('{{name}}', teamName);
    wrap.innerHTML = '<p class="admin-empty">Cargando…</p>';
    modal.style.display = '';

    try {
        var results = await Promise.all([
            api.get('/api/sharing/by-team/' + teamId + '/agent').catch(function () { return []; }),
            api.get('/api/sharing/by-team/' + teamId + '/connection').catch(function () { return []; }),
            api.get('/api/sharing/by-team/' + teamId + '/knowledge').catch(function () { return []; }),
        ]);

        var all = [];
        results[0].forEach(function (r) { all.push({ type: 'agent', resource_id: r.resource_id, shared_by: r.shared_by, shared_at: r.shared_at }); });
        results[1].forEach(function (r) { all.push({ type: 'connection', resource_id: r.resource_id, shared_by: r.shared_by, shared_at: r.shared_at }); });
        results[2].forEach(function (r) { all.push({ type: 'knowledge', resource_id: r.resource_id, shared_by: r.shared_by, shared_at: r.shared_at }); });

        if (!all.length) {
            wrap.innerHTML = '<p class="admin-empty">' + t('teams.teams.modal_directory.empty') + '</p>';
            return;
        }

        var rows = all.map(function (r) {
            var typeLabel = t('teams.teams.sharing.type_' + r.type) || r.type;
            var date = r.shared_at
                ? new Date(r.shared_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : '—';
            return '<tr>' +
                '<td><span class="badge badge--std">' + esc(typeLabel) + '</span></td>' +
                '<td>' + esc(r.resource_id) + '</td>' +
                '<td>' + esc(r.shared_by) + '</td>' +
                '<td class="td-date">' + date + '</td>' +
                '</tr>';
        }).join('');

        wrap.innerHTML =
            '<table class="admin-table">' +
            '<thead><tr>' +
            '<th>' + t('teams.teams.modal_directory.col_type') + '</th>' +
            '<th>' + t('teams.teams.modal_directory.col_name') + '</th>' +
            '<th>' + t('teams.teams.modal_directory.col_shared_by') + '</th>' +
            '<th>' + t('teams.teams.modal_directory.col_date') + '</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '</table>';
    } catch (e) {
        wrap.innerHTML = '<p class="admin-empty">Error: ' + esc(e.message) + '</p>';
    }
}

function _bindMembersModal() {
    var modal = document.getElementById('modal-members');
    var btnClose = document.getElementById('btn-members-close');
    if (!modal) return;
    if (btnClose) btnClose.addEventListener('click', function () { modal.style.display = 'none'; });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
}

function _bindDirectoryModal() {
    var modal = document.getElementById('modal-directory');
    var btnClose = document.getElementById('btn-directory-close');
    if (!modal) return;
    if (btnClose) btnClose.addEventListener('click', function () { modal.style.display = 'none'; });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.style.display = 'none'; });
}

// ── Invitaciones ───────────────────────────────────────────────────────────────

function _renderInvitationsTab(received, sent) {
    _renderReceivedInvitations(received);
    _renderSentInvitations(sent);
}

function _renderReceivedInvitations(invitations) {
    var wrap = document.getElementById('teams-inv-received-wrap');
    if (!wrap) return;

    if (!invitations.length) {
        wrap.innerHTML = '<p class="admin-empty">' + t('teams.teams.invitations.no_received') + '</p>';
        return;
    }

    var rows = invitations.map(function (inv) {
        var date = inv.created_at
            ? new Date(inv.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        var statusBadge = _invStatusBadge(inv.status);
        var actions = inv.status === 'pending'
            ? '<button class="btn btn-primary btn-sm" data-accept="' + esc(inv.id) + '">' + t('teams.teams.invitations.accept') + '</button>' +
              '<button class="btn btn-ghost btn-sm" data-reject="' + esc(inv.id) + '">' + t('teams.teams.invitations.reject') + '</button>'
            : '';
        return '<tr>' +
            '<td>' + esc(inv.team_name || inv.team_id) + '</td>' +
            '<td>' + esc(inv.invited_by) + '</td>' +
            '<td class="td-date">' + date + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td class="td-actions">' + actions + '</td>' +
            '</tr>';
    }).join('');

    wrap.innerHTML =
        '<table class="admin-table">' +
        '<thead><tr>' +
        '<th>' + t('teams.teams.invitations.col_team') + '</th>' +
        '<th>' + t('teams.teams.invitations.col_invited_by') + '</th>' +
        '<th>' + t('teams.teams.invitations.col_date') + '</th>' +
        '<th>' + t('teams.teams.invitations.col_status') + '</th>' +
        '<th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';

    wrap.querySelectorAll('[data-accept]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            await _respondInvitation(btn.dataset.accept, true);
        });
    });
    wrap.querySelectorAll('[data-reject]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            await _respondInvitation(btn.dataset.reject, false);
        });
    });
}

function _renderSentInvitations(invitations) {
    var wrap = document.getElementById('teams-inv-sent-wrap');
    if (!wrap) return;

    if (!invitations.length) {
        wrap.innerHTML = '<p class="admin-empty">' + t('teams.teams.invitations.no_sent') + '</p>';
        return;
    }

    var rows = invitations.map(function (inv) {
        var date = inv.created_at
            ? new Date(inv.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        var statusBadge = _invStatusBadge(inv.status);
        var actions = inv.status === 'pending'
            ? '<button class="btn btn-ghost btn-sm action-item--danger" data-cancel-inv="' + esc(inv.id) + '" data-team="' + esc(inv.team_id) + '">' +
              t('teams.teams.invitations.cancel') + '</button>'
            : '';
        return '<tr>' +
            '<td>' + esc(inv.invited_email) + '</td>' +
            '<td>' + esc(inv.team_name || inv.team_id) + '</td>' +
            '<td class="td-date">' + date + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td class="td-actions">' + actions + '</td>' +
            '</tr>';
    }).join('');

    wrap.innerHTML =
        '<table class="admin-table">' +
        '<thead><tr>' +
        '<th>' + t('teams.teams.invitations.col_email') + '</th>' +
        '<th>' + t('teams.teams.invitations.col_team') + '</th>' +
        '<th>' + t('teams.teams.invitations.col_date') + '</th>' +
        '<th>' + t('teams.teams.invitations.col_status') + '</th>' +
        '<th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';

    wrap.querySelectorAll('[data-cancel-inv]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            if (!confirm(t('teams.teams.invitations.confirm_cancel'))) return;
            try {
                await api.del('/api/teams/' + btn.dataset.team + '/invitations/' + encodeURIComponent(btn.dataset.cancelInv));
                toast(t('teams.teams.invitations.cancel') + ' ✓', 'success');
                _profileTeamsLoaded = false;
                loadTeamsSection();
            } catch (err) { toast(err.message || 'Error', 'error'); }
        });
    });
}

function _invStatusBadge(status) {
    var cls = { pending: 'badge--warn', accepted: 'badge--ok', rejected: 'badge--danger', expired: 'badge--std' }[status] || 'badge--std';
    var label = t('teams.teams.invitations.status_' + status) || status;
    return '<span class="badge ' + cls + '">' + label + '</span>';
}

async function _respondInvitation(token, accept) {
    try {
        var endpoint = accept
            ? '/api/teams/invitations/' + token + '/accept'
            : '/api/teams/invitations/' + token + '/reject';
        await api.post(endpoint, {});
        var msg = accept ? t('teams.teams.invitations.accept') + ' ✓' : t('teams.teams.invitations.reject') + ' ✓';
        toast(msg, 'success');
        _profileTeamsLoaded = false;
        _allMembersCache = {};
        loadTeamsSection();
    } catch (err) {
        toast(err.message || 'Error', 'error');
    }
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

function _bindTeamsTabs() {
    document.querySelectorAll('[data-teams-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _activeTeamsTab = btn.dataset.teamsTab;
            document.querySelectorAll('[data-teams-tab]').forEach(function (b) {
                b.classList.toggle('active', b === btn);
            });
            ['my-teams', 'invitations'].forEach(function (id) {
                var panel = document.getElementById('teams-panel-' + (id === 'my-teams' ? 'my' : 'invitations'));
                if (panel) panel.style.display = (id === _activeTeamsTab) ? '' : 'none';
            });
        });
    });
}

// ── Crear equipo ───────────────────────────────────────────────────────────────

function _applyGuestRestrictions() {
    var btn = document.getElementById('btn-create-team');
    if (!btn || !_profileIsGuest) return;
    btn.disabled = true;
    btn.title = t('teams.teams.guest_cannot_create') || 'Solo las cuentas registradas pueden crear equipos';
    btn.style.cursor = 'not-allowed';
    btn.style.opacity = '0.45';
    btn.style.pointerEvents = 'auto'; // keep visible but blocked so tooltip shows
}

function _bindCreateTeam() {
    var btn = document.getElementById('btn-create-team');
    if (!btn) return;
    btn.addEventListener('click', function () {
        var name = prompt(t('teams.teams.team_name_placeholder') || 'Nombre del equipo');
        if (!name || !name.trim()) return;
        api.post('/api/teams/', { name: name.trim() }).then(function () {
            toast(t('teams.teams.create_team') + ' ✓', 'success');
            _profileTeamsLoaded = false;
            _allMembersCache = {};
            loadTeamsSection();
        }).catch(function (err) {
            toast(err.message || 'Error', 'error');
        });
    });
}

// ── Token de invitación en URL ─────────────────────────────────────────────────

function _checkInvitationToken() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get('tab');
    if (tab === 'teams') {
        var navBtn = document.querySelector('.profile-nav-item[data-section="section-teams"]');
        if (navBtn) navBtn.click();
    }
}

// ── Inicialización ─────────────────────────────────────────────────────────────

(function () {
    if (window._bindNavTeamsHooked) return;
    window._bindNavTeamsHooked = true;

    document.addEventListener('DOMContentLoaded', function () {
        var navBtn = document.getElementById('nav-teams');
        if (navBtn) {
            navBtn.addEventListener('click', function () {
                loadTeamsSection();
            });
        }
        var params = new URLSearchParams(window.location.search);
        if (params.get('tab') === 'teams') {
            function _tryLoad() {
                if (window.i18n && window.i18n.ready) {
                    window.i18n.ready(loadTeamsSection);
                } else {
                    setTimeout(_tryLoad, 50);
                }
            }
            _tryLoad();
        }
    });
}());

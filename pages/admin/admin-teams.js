'use strict';

// admin-teams.js — pestaña "Grupos" del panel de administracion
// Los grupos pertenecen a workspaces; reemplazan los antiguos equipos independientes.

var _teamSort = { col: 'created_at', dir: -1 };

var _GROUP_PALETTE = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#db2777'];
function _groupColor(name) {
    var c = 0;
    for (var i = 0; i < (name || '').length; i++) c += name.charCodeAt(i);
    return _GROUP_PALETTE[c % _GROUP_PALETTE.length];
}

function _thT(label, col) {
    var arrow = _teamSort.col === col ? (_teamSort.dir === 1 ? ' ▲' : ' ▼') : '';
    return '<th class="sortable" data-sort="' + col + '">' + label + arrow + '</th>';
}

function renderTeams(groups) {
    var wrap = document.getElementById('teams-table-wrap');
    if (!wrap) return;
    if (!groups.length) {
        wrap.innerHTML = '<div class="admin-empty">No hay grupos que coincidan con los filtros.</div>';
        return;
    }

    var rows = groups.map(function (g) {
        var letter = (g.name || '?').charAt(0).toUpperCase();
        var color  = _groupColor(g.name || '');
        var date   = g.created_at
            ? new Date(g.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        var actions =
            '<div class="admin-actions-menu">' +
            '<button class="btn-actions">&#8942;</button>' +
            '<div class="actions-dropdown" style="display:none">' +
            '<button class="action-item action-item--danger" data-action="delete" data-team-id="' + esc(g.id) + '" data-team-name="' + esc(g.name) + '">' +
            '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            'Eliminar</button>' +
            '</div></div>';

        return '<tr>' +
            '<td><div class="user-avatar-cell">' +
            '<div class="user-avatar-sm" style="background:' + color + ';border-radius:8px;flex-shrink:0">' + esc(letter) + '</div>' +
            '<span>' + esc(g.name) + '</span>' +
            '</div></td>' +
            '<td class="td-email">' + esc(g.workspace_id || '—') + '</td>' +
            '<td class="td-email">' + esc(g.created_by || '—') + '</td>' +
            '<td><span class="badge badge--std">' + (g.member_count || 0) + ' miembro' + (g.member_count === 1 ? '' : 's') + '</span></td>' +
            '<td>' + (g.resource_count > 0
                ? '<span class="badge badge--ok">' + g.resource_count + ' recurso' + (g.resource_count === 1 ? '' : 's') + '</span>'
                : '<span style="color:var(--ink-3);font-size:12px">—</span>') + '</td>' +
            '<td class="td-date">' + date + '</td>' +
            '<td class="td-actions">' + actions + '</td>' +
            '</tr>';
    }).join('');

    wrap.innerHTML =
        '<table class="admin-table">' +
        '<thead><tr>' +
        _thT('Nombre', 'name') +
        '<th>Workspace</th>' +
        _thT('Creado por', 'created_by') +
        '<th>Miembros</th>' +
        '<th>Recursos</th>' +
        _thT('Creado', 'created_at') +
        '<th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';

    wrap.querySelector('thead').addEventListener('click', function (e) {
        var th = e.target.closest('.sortable');
        if (!th) return;
        var col = th.dataset.sort;
        _teamSort.dir = _teamSort.col === col ? _teamSort.dir * -1 : 1;
        _teamSort.col = col;
        applyTeamFilters();
    });

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
        var item = e.target.closest('.action-item');
        if (!item) return;
        allDropdowns.forEach(function (d) { d.style.display = 'none'; });
        _handleTeamAction(item.dataset.action, item.dataset.teamId, item.dataset.teamName);
    });
}

async function _handleTeamAction(action, groupId, groupName) {
    if (action === 'delete') {
        if (!confirm('Eliminar el grupo "' + groupName + '"?')) return;
        try {
            await api.del('/api/admin/groups/' + encodeURIComponent(groupId));
            toast('Grupo eliminado', 'success');
            _allTeams = await api.get('/api/admin/groups');
            applyTeamFilters();
        } catch (err) {
            toast(err.detail || err.message || 'Error al eliminar', 'error');
        }
    }
}

function applyTeamFilters() {
    var q = (document.getElementById('team-search') ? document.getElementById('team-search').value : '').toLowerCase();

    var filtered = _allTeams.filter(function (g) {
        if (q && !(g.name || '').toLowerCase().includes(q) &&
            !(g.created_by || '').toLowerCase().includes(q) &&
            !(g.workspace_id || '').toLowerCase().includes(q)) return false;
        return true;
    });

    var col = _teamSort.col;
    var dir = _teamSort.dir;
    filtered = filtered.slice().sort(function (a, b) {
        var av = String(a[col] || '').toLowerCase();
        var bv = String(b[col] || '').toLowerCase();
        return av < bv ? -dir : av > bv ? dir : 0;
    });

    renderTeams(filtered);
}

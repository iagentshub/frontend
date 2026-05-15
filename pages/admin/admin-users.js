'use strict';

var _allUsers = [];
var _userSort = { col: 'created_at', dir: -1 };

function _thU(label, col) {
    var arrow = _userSort.col === col ? (_userSort.dir === 1 ? ' ▲' : ' ▼') : '';
    return '<th class="sortable" data-sort="' + col + '">' + label + arrow + '</th>';
}

function renderUsers(users) {
    var wrap = document.getElementById('users-table-wrap');
    if (!users.length) {
        wrap.innerHTML = '<div class="admin-empty">No hay usuarios que coincidan con los filtros.</div>';
        return;
    }

    var rows = users.map(function (u) {
        var isActive = u.is_active !== 0 && u.is_active !== false;
        var isVerified = u.is_verified !== 0 && u.is_verified !== false;
        var isAdmin = u.role === 'admin';

        var statusBadge = isActive
            ? '<span class="badge badge--ok">Activo</span>'
            : '<span class="badge badge--danger">Bloqueado</span>';

        var verifiedBadge = isVerified
            ? '<span class="badge badge--ok">Verificado</span>'
            : '<span class="badge badge--warn">Sin verificar</span>';

        var roleBadge = isAdmin
            ? '<span class="badge badge--admin">Admin</span>'
            : '<span class="badge badge--std">Estándar</span>';

        var date = u.created_at
            ? new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';

        var actions = isAdmin ? '' :
            '<div class="admin-actions-menu" data-username="' + esc(u.username) + '">' +
            '<button class="btn-actions" data-username="' + esc(u.username) + '">⋮</button>' +
            '<div class="actions-dropdown" style="display:none">' +
            (isActive
                ? '<button class="action-item" data-action="block" data-username="' + esc(u.username) + '">🚫 Bloquear</button>'
                : '<button class="action-item" data-action="unblock" data-username="' + esc(u.username) + '">✅ Desbloquear</button>') +
            '<button class="action-item" data-action="make-admin" data-username="' + esc(u.username) + '">👑 Hacer admin</button>' +
            '<button class="action-item action-item--danger" data-action="delete" data-username="' + esc(u.username) + '">🗑 Eliminar</button>' +
            '</div>' +
            '</div>';

        return '<tr data-username="' + esc(u.username) + '">' +
            '<td class="td-email"><div class="user-avatar-cell"><div class="user-avatar-sm">' +
            esc((u.email || u.username || '?').charAt(0).toUpperCase()) +
            '</div><span>' + esc(u.email || u.username) + '</span></div></td>' +
            '<td>' + roleBadge + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + verifiedBadge + '</td>' +
            '<td class="td-date">' + date + '</td>' +
            '<td class="td-actions">' + actions + '</td>' +
            '</tr>';
    }).join('');

    wrap.innerHTML =
        '<table class="admin-table">' +
        '<thead><tr>' +
        _thU('Email', 'email') +
        _thU('Rol', 'role') +
        '<th>Estado</th>' +
        '<th>Verificado</th>' +
        _thU('Creado', 'created_at') +
        '<th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';

    wrap.querySelector('thead').addEventListener('click', function (e) {
        var th = e.target.closest('.sortable');
        if (!th) return;
        var col = th.dataset.sort;
        _userSort.dir = _userSort.col === col ? _userSort.dir * -1 : 1;
        _userSort.col = col;
        applyUserFilters();
    });

    // Dropdown toggle
    wrap.addEventListener('click', function (e) {
        // Close all open dropdowns first
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
        // Close on click outside
        if (!e.target.closest('.admin-actions-menu')) {
            allDropdowns.forEach(function (d) { d.style.display = 'none'; });
        }

        // Action items
        var item = e.target.closest('.action-item');
        if (!item) return;
        var action = item.dataset.action;
        var username = item.dataset.username;
        allDropdowns.forEach(function (d) { d.style.display = 'none'; });
        _handleUserAction(action, username);
    });
}

async function _handleUserAction(action, username) {
    try {
        if (action === 'block') {
            await api.patch('/api/admin/users/' + encodeURIComponent(username), { is_active: false });
            toast('Usuario bloqueado', 'success');
        } else if (action === 'unblock') {
            await api.patch('/api/admin/users/' + encodeURIComponent(username), { is_active: true });
            toast('Usuario desbloqueado', 'success');
        } else if (action === 'make-admin') {
            if (!confirm('¿Promover a ' + username + ' a administrador?')) return;
            await api.patch('/api/admin/users/' + encodeURIComponent(username), { role: 'admin' });
            toast('Usuario promovido a admin', 'success');
        } else if (action === 'delete') {
            if (!confirm('¿Eliminar permanentemente a ' + username + '?')) return;
            await api.del('/api/admin/users/' + encodeURIComponent(username));
            toast('Usuario eliminado', 'success');
        }
        await reloadData();
    } catch (err) {
        toast(err.message || 'Error al realizar la acción', 'error');
    }
}

function applyUserFilters() {
    var q = (document.getElementById('user-search').value || '').toLowerCase();
    var role = document.getElementById('filter-role').value;
    var active = document.getElementById('filter-active').value;
    var verified = document.getElementById('filter-verified').value;

    var filtered = _allUsers.filter(function (u) {
        if (q && !(u.email || '').toLowerCase().includes(q) && !(u.username || '').toLowerCase().includes(q)) return false;
        if (role && u.role !== role) return false;
        if (active) {
            var want = active === 'true';
            if (Boolean(u.is_active !== 0 && u.is_active !== false) !== want) return false;
        }
        if (verified) {
            var wantV = verified === 'true';
            if (Boolean(u.is_verified !== 0 && u.is_verified !== false) !== wantV) return false;
        }
        return true;
    });

    var col = _userSort.col;
    var dir = _userSort.dir;
    filtered = filtered.slice().sort(function (a, b) {
        var av = (a[col] || '').toString().toLowerCase();
        var bv = (b[col] || '').toString().toLowerCase();
        return av < bv ? -dir : av > bv ? dir : 0;
    });

    renderUsers(filtered);
}

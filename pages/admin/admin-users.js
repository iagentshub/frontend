// admin-users.js — gestión de usuarios (solo admin)
'use strict';

async function init() {
    await window.requireAuth();
    renderNav('nav-root', 'admin-users');
    await loadUsers();
}

async function loadUsers() {
    var wrap = document.getElementById('users-table-wrap');
    try {
        var users = await api.get('/api/admin/users');
        renderTable(users, wrap);
    } catch (e) {
        if (e.status === 403) {
            window.location.replace('/agents/');
        } else {
            wrap.innerHTML = '<div class="loading-state">Error al cargar usuarios.</div>';
        }
    }
}

function renderTable(users, wrap) {
    if (!users.length) {
        wrap.innerHTML = '<div class="empty-users">No hay usuarios registrados.</div>';
        return;
    }

    var rows = users.map(function (u) {
        var initial = (u.username || '?').charAt(0).toUpperCase();
        var roleCls = u.role === 'admin' ? 'role-badge--admin' : 'role-badge--standard';
        var roleLabel = u.role === 'admin' ? 'Admin' : 'Estándar';
        var date = u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES') : '—';
        return '<tr>' +
            '<td><div class="user-name-cell">' +
            '<div class="user-avatar">' + esc(initial) + '</div>' +
            '<span>' + esc(u.username) + '</span>' +
            '</div></td>' +
            '<td>' + esc(u.email || '—') + '</td>' +
            '<td><span class="role-badge ' + roleCls + '">' + roleLabel + '</span></td>' +
            '<td>' + date + '</td>' +
            '<td>' +
            (u.role !== 'admin'
                ? '<button class="btn-delete" data-username="' + esc(u.username) + '">Eliminar</button>'
                : '—') +
            '</td>' +
            '</tr>';
    }).join('');

    wrap.innerHTML =
        '<table class="users-table">' +
        '<thead><tr>' +
        '<th>Usuario</th><th>Email</th><th>Rol</th><th>Registro</th><th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';

    wrap.querySelectorAll('.btn-delete').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            var username = btn.dataset.username;
            if (!confirm('¿Eliminar al usuario ' + username + '? Esta acción no se puede deshacer.')) return;
            try {
                await api.del('/api/admin/users/' + encodeURIComponent(username));
                toast('Usuario eliminado', 'success');
                await loadUsers();
            } catch (e) {
                toast(e.message || 'Error al eliminar', 'error');
            }
        });
    });
}

init();

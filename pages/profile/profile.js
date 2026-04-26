// profile.js
'use strict';

async function init() {
    await window.requireAuth();
    renderNav('nav-root', 'profile');
    loadUser();
    bindEvents();
}

function loadUser() {
    fetch('/api/auth/me').then(function (r) { return r.json(); }).then(function (d) {
        var u = d.username || 'admin';
        var el = document.getElementById('profile-username');
        var av = document.getElementById('profile-avatar');
        if (el) el.textContent = u;
        if (av) av.textContent = u.charAt(0).toUpperCase();
    }).catch(function () { });
}

function bindEvents() {
    document.getElementById('password-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var current = document.getElementById('pw-current').value;
        var newPw = document.getElementById('pw-new').value;
        var confirm = document.getElementById('pw-confirm').value;
        if (!current || !newPw || !confirm) {
            toast('Completa todos los campos', 'error'); return;
        }
        if (newPw !== confirm) {
            toast('Las contrasenas no coinciden', 'error'); return;
        }
        var btn = document.getElementById('pw-save-btn');
        btn.disabled = true; btn.textContent = 'Guardando...';
        try {
            await api.post('/api/auth/change-password', { current_password: current, new_password: newPw });
            toast('Contrasena actualizada', 'success');
            document.getElementById('password-form').reset();
        } catch (err) {
            toast(err.message || 'Error al cambiar contrasena', 'error');
        } finally {
            btn.disabled = false; btn.textContent = 'Guardar cambios';
        }
    });
}

init();

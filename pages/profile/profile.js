// profile.js
'use strict';

var _currentRole = 'standard';

var ROLE_LABELS = {
    admin:    'Administrador',
    standard: 'Usuario',
    guest:    'Invitado',
};

async function init() {
    await window.requireAuth();
    renderNav('nav-root', 'profile');
    await loadUser();
    await renderThemePicker();
    bindEvents();
}

async function loadUser() {
    try {
        var r = await fetch('/api/auth/me');
        var d = await r.json();
        var u = d.username || '';
        _currentRole = d.role || 'standard';

        var elName = document.getElementById('profile-username');
        var elRole = document.getElementById('profile-role');
        var elAvatar = document.getElementById('profile-avatar');
        if (elName) elName.textContent = u;
        if (elRole) elRole.textContent = ROLE_LABELS[_currentRole] || _currentRole;
        if (elAvatar) elAvatar.textContent = u.charAt(0).toUpperCase() || '?';

        // Ocultar cambio de contraseña para invitados
        if (_currentRole === 'guest') {
            var pwCard = document.getElementById('password-card');
            if (pwCard) pwCard.style.display = 'none';
        }
    } catch (e) { }
}

async function renderThemePicker() {
    var container = document.getElementById('theme-picker');
    if (!container || !window.THEMES) return;

    // Cargar tema desde servidor solo si no es invitado
    if (_currentRole !== 'guest') {
        try {
            var r = await fetch('/api/settings');
            if (r.ok) {
                var s = await r.json();
                if (s.theme) window.setTheme(s.theme);
            }
        } catch (e) { }
    }

    var current = window.getTheme();

    container.innerHTML = window.THEMES.map(function (t) {
        var active = current === t.id;
        return '<div class="theme-swatch' + (active ? ' theme-swatch--active' : '') + '" data-theme-pick="' + t.id + '">' +
            '<div class="theme-swatch-preview" style="--swatch-bg:' + t.bg + ';--swatch-accent:' + t.accent + '"></div>' +
            '<span class="theme-swatch-name">' + t.name + '</span>' +
            '</div>';
    }).join('');

    container.querySelectorAll('[data-theme-pick]').forEach(function (sw) {
        sw.addEventListener('click', async function () {
            var themeId = sw.dataset.themePick;
            window.setTheme(themeId);
            container.querySelectorAll('.theme-swatch').forEach(function (s) {
                s.classList.toggle('theme-swatch--active', s.dataset.themePick === themeId);
            });
            // Solo persistir en servidor si no es invitado
            if (_currentRole !== 'guest') {
                try {
                    await fetch('/api/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ theme: themeId }),
                    });
                } catch (e) { }
            }
        });
    });
}

function bindEvents() {
    var form = document.getElementById('password-form');
    if (!form) return;
    form.addEventListener('submit', async function (e) {
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
            form.reset();
        } catch (err) {
            toast(err.message || 'Error al cambiar contrasena', 'error');
        } finally {
            btn.disabled = false; btn.textContent = 'Guardar cambios';
        }
    });
}

init();

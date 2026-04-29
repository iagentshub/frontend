// button_login_guest.js — Botón de acceso como invitado
'use strict';

function renderGuestLoginButton(mountId, apiBase) {
    var mount = document.getElementById(mountId);
    if (!mount) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-guest';
    btn.innerHTML = '<span class="btn-guest__label">Acceder como invitado</span>';

    btn.addEventListener('click', async function () {
        btn.setAttribute('aria-busy', 'true');
        btn.querySelector('.btn-guest__label').textContent = 'Entrando…';
        try {
            var r = await fetch((apiBase || '') + '/api/auth/guest', { method: 'POST' });
            if (r.ok) {
                window.location.replace('/agents/');
            } else {
                btn.removeAttribute('aria-busy');
                btn.querySelector('.btn-guest__label').textContent = 'Acceder como invitado';
            }
        } catch (ex) {
            btn.removeAttribute('aria-busy');
            btn.querySelector('.btn-guest__label').textContent = 'Acceder como invitado';
        }
    });

    mount.appendChild(btn);
}

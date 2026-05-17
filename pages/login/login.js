'use strict';

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = window.t ? window.t('auth.login_btn_loading') : 'Entrando…';

    try {
        const r = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (r.ok) {
            window.location.replace('/dashboard/');
        } else {
            const data = await r.json().catch(() => ({}));
            errEl.textContent = data.detail || (window.t ? window.t('auth.error_invalid') : 'Credenciales incorrectas');
            errEl.style.display = '';
        }
    } catch {
        errEl.textContent = window.t ? window.t('auth.error_connection') : 'Error de conexión';
        errEl.style.display = '';
    } finally {
        btn.disabled = false;
        btn.textContent = window.t ? window.t('auth.login_btn') : 'Entrar';
    }
});

// Password toggle
const _EYE_OPEN = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 9s3-5.5 8-5.5S17 9 17 9s-3 5.5-8 5.5S1 9 1 9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>';
const _EYE_CLOSED = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 9s3-5.5 8-5.5S17 9 17 9s-3 5.5-8 5.5S1 9 1 9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
document.getElementById('toggle-pw')?.addEventListener('click', function() {
    const inp = document.getElementById('login-password');
    const showing = inp.type === 'text';
    inp.type = showing ? 'password' : 'text';
    this.innerHTML = showing ? _EYE_OPEN : _EYE_CLOSED;
    this.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
});

// Guest login
document.getElementById('btn-guest')?.addEventListener('click', async function() {
    const btn = this;
    btn.disabled = true;
    try {
        const r = await fetch('/api/auth/guest', { method: 'POST' });
        if (r.ok) window.location.replace('/dashboard/');
    } finally {
        btn.disabled = false;
    }
});

// Redirect if already logged in
fetch('/api/auth/me').then(r => {
    if (r.ok) window.location.replace('/dashboard/');
});

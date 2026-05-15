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
document.getElementById('toggle-pw')?.addEventListener('click', function() {
    const inp = document.getElementById('login-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
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

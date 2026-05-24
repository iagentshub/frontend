'use strict';

document.getElementById('forgot-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = document.getElementById('forgot-email').value.trim();
    var errEl = document.getElementById('forgot-error');
    var btn = document.getElementById('forgot-btn');

    errEl.style.display = 'none';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errEl.textContent = 'Introduce un email válido';
        errEl.style.display = '';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando…';

    try {
        var r = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email }),
        });
        if (r.ok) {
            document.getElementById('form-wrap').style.display = 'none';
            document.getElementById('sent-msg').style.display = '';
        } else {
            var data = await r.json().catch(function () { return {}; });
            errEl.textContent = data.detail || 'Error al enviar el email';
            errEl.style.display = '';
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión';
        errEl.style.display = '';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar enlace';
    }
});

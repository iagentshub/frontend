'use strict';

var _token = new URLSearchParams(window.location.search).get('token') || '';

if (!_token) {
    document.getElementById('reset-form-wrap').style.display = 'none';
    document.getElementById('reset-invalid').style.display = '';
}

document.getElementById('toggle-pw').addEventListener('click', function () {
    var inp = document.getElementById('reset-pw');
    inp.type = inp.type === 'password' ? 'text' : 'password';
});

document.getElementById('reset-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var pw = document.getElementById('reset-pw').value;
    var pw2 = document.getElementById('reset-pw2').value;
    var errEl = document.getElementById('reset-error');
    var btn = document.getElementById('reset-btn');

    errEl.style.display = 'none';

    if (pw.length < 8) {
        errEl.textContent = 'La contraseña debe tener al menos 8 caracteres';
        errEl.style.display = '';
        return;
    }
    if (pw !== pw2) {
        errEl.textContent = 'Las contraseñas no coinciden';
        errEl.style.display = '';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
        var r = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: _token, password: pw }),
        });
        if (r.ok) {
            document.getElementById('reset-form-wrap').style.display = 'none';
            document.getElementById('reset-ok').style.display = '';
            setTimeout(function () { window.location.replace('/login/'); }, 2500);
        } else {
            var data = await r.json().catch(function () { return {}; });
            if (r.status === 400 && (data.detail || '').toLowerCase().includes('expirad')) {
                document.getElementById('reset-form-wrap').style.display = 'none';
                document.getElementById('reset-invalid').style.display = '';
            } else {
                errEl.textContent = data.detail || 'Error al guardar la contraseña';
                errEl.style.display = '';
            }
        }
    } catch (_) {
        errEl.textContent = 'Error de conexión';
        errEl.style.display = '';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar contraseña';
    }
});

'use strict';

(async function () {
    var token = new URLSearchParams(window.location.search).get('token') || '';
    var loading = document.getElementById('verify-loading');
    var ok = document.getElementById('verify-ok');
    var error = document.getElementById('verify-error');

    if (!token) {
        loading.style.display = 'none';
        error.style.display = '';
        return;
    }

    try {
        var r = await fetch('/api/auth/verify?token=' + encodeURIComponent(token));
        loading.style.display = 'none';
        if (r.ok) {
            ok.style.display = '';
            setTimeout(function () { window.location.replace('/dashboard/'); }, 2000);
        } else {
            error.style.display = '';
        }
    } catch (_) {
        loading.style.display = 'none';
        error.style.display = '';
    }
})();

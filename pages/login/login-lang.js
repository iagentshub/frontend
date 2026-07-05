'use strict';
(function () {
    var btn = document.getElementById('login-lang-btn');
    if (!btn) return;
    function sync() { if (window.i18n) btn.textContent = window.i18n.getLang().toUpperCase(); }
    btn.addEventListener('click', function () {
        var next = (window.i18n ? window.i18n.getLang() : 'es') === 'es' ? 'en' : 'es';
        if (window.i18n) window.i18n.setLang(next);
        sync();
    });
    if (window.i18n) { window.i18n.ready(sync); window.i18n.onLangChange(sync); }
}());

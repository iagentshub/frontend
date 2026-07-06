// auth.js — guard de autenticación
'use strict';

// Ocultar el body inmediatamente para evitar el flash de contenido
// protegido antes de que se compruebe la sesión.
document.body.style.visibility = 'hidden';

/**
 * Verifica que el usuario tenga sesión activa y, opcionalmente, un rol concreto.
 *
 * @param {Object} [opts]
 * @param {string} [opts.role] — Si se indica, redirige a '/' cuando el rol del
 *   usuario no coincida (p.ej. { role: 'admin' } para páginas de administración).
 */
window.requireAuth = async function (opts) {
    var requiredRole = (opts && opts.role) || null;
    try {
        var ctrl = new AbortController();
        var t = setTimeout(function () { ctrl.abort(); }, 8000);
        var r = await fetch((window.API_BASE || '') + '/api/auth/me', { signal: ctrl.signal });
        clearTimeout(t);
        if (!r.ok) { window.location.replace('/login/'); return; }
        var d = await r.json();
        // Rol insuficiente: redirigir al inicio, no al login (está autenticado)
        if (requiredRole && d.role !== requiredRole) {
            window.location.replace('/');
            return;
        }
        if (d.role !== 'guest') {
            fetch((window.API_BASE || '') + '/api/settings')
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (s) {
                    if (!s) return;
                    if (s.theme && window.setTheme && s.theme !== window.getTheme()) window.setTheme(s.theme);
                    if (s.language && window.i18n && s.language !== window.i18n.getLang()) window.i18n.setLang(s.language);
                })
                .catch(function () {});
        }
        document.body.style.visibility = '';
    } catch (e) {
        window.location.replace('/login/');
    }
};

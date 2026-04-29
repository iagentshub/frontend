// auth.js — guard de autenticación
'use strict';

window.requireAuth = async function () {
    try {
        var r = await fetch((window.API_BASE || '') + '/api/auth/me');
        if (!r.ok) { window.location.replace('/login/'); return; }
        var d = await r.json();
        // Solo sincronizar tema desde servidor para usuarios no invitados
        if (d.role !== 'guest' && window._syncThemeFromServer) {
            window._syncThemeFromServer();
        }
    } catch (e) {
        window.location.replace('/login/');
    }
};

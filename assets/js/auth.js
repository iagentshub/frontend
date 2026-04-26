// auth.js — guard de autenticación
'use strict';

window.requireAuth = async function () {
    try {
        var r = await fetch((window.API_BASE || '') + '/api/auth/me');
        if (!r.ok) window.location.replace('/login/');
    } catch (e) {
        window.location.replace('/login/');
    }
};

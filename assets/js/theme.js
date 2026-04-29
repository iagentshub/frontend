// theme.js — gestión de temas
// Ejecutar lo antes posible para evitar flash de tema incorrecto.
'use strict';

(function () {
    // Aplicar tema guardado localmente de forma inmediata (sin flash)
    var saved = localStorage.getItem('ga-theme') || 'noir';
    document.documentElement.setAttribute('data-theme', saved);

    window.THEMES = [
        { id: 'noir',   name: 'Noir',   dark: true,  bg: '#080808', accent: '#CC2020' },
        { id: 'marble', name: 'Marble', dark: false, bg: '#f5f5f7', accent: '#CC2020' },
        { id: 'ember',  name: 'Ember',  dark: true,  bg: '#080808', accent: '#E8762A' },
        { id: 'ocean',  name: 'Ocean',  dark: true,  bg: '#060c14', accent: '#2563EB' },
        { id: 'forest', name: 'Forest', dark: true,  bg: '#050e08', accent: '#10B981' },
        { id: 'dusk',   name: 'Dusk',   dark: true,  bg: '#08060e', accent: '#7C3AED' },
    ];

    window.getTheme = function () {
        return document.documentElement.getAttribute('data-theme') || 'noir';
    };

    window.setTheme = function (theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('ga-theme', theme);
    };

    // Sincronizar tema desde el servidor en background (no bloquea la carga)
    window._syncThemeFromServer = function () {
        fetch('/api/settings')
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (s) {
                if (s && s.theme && s.theme !== window.getTheme()) {
                    window.setTheme(s.theme);
                }
            })
            .catch(function () { });
    };
}());

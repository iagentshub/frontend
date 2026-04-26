// theme.js — gestión del tema claro/oscuro
// Ejecutar lo antes posible para evitar flash de tema incorrecto.
'use strict';

(function () {
    var saved = localStorage.getItem('ga-theme');
    if (saved === 'light' || saved === 'dark') {
        document.documentElement.setAttribute('data-theme', saved);
    }

    window.getTheme = function () {
        return document.documentElement.getAttribute('data-theme') ||
            (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    };

    window.setTheme = function (theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('ga-theme', theme);
        document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
            btn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            btn.innerHTML = theme === 'dark' ? _iconSun() : _iconMoon();
        });
    };

    window.toggleTheme = function () {
        window.setTheme(window.getTheme() === 'dark' ? 'light' : 'dark');
    };

    function _iconSun() {
        return '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
            '<circle cx="8" cy="8" r="3"/>' +
            '<path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06"/>' +
            '</svg>';
    }

    function _iconMoon() {
        return '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
            '<path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z"/>' +
            '</svg>';
    }

    // Exponer iconos para la nav
    window._themeIcons = { sun: _iconSun, moon: _iconMoon };
}());

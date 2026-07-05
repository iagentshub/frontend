// theme-early.js — Aplica el tema guardado antes del primer render para evitar FOUC.
// IMPORTANTE: debe cargarse de forma síncrona (sin defer/async) en <head>.
(function () {
    var m = {
        noir: 'dark-red', marble: 'light-red', ember: 'dark-orange',
        ocean: 'dark-blue', forest: 'dark-red', dusk: 'dark-purple', light: 'light-red'
    };
    var t = localStorage.getItem('ga-theme') || 'dark-red';
    t = m[t] || t;
    document.documentElement.setAttribute('data-theme', t);
})();

// toast.js — notificaciones emergentes
'use strict';

(function () {
    var container = document.createElement('div');
    container.id = 'ga-toast';
    document.body.appendChild(container);

    window.toast = function (msg, type, ms) {
        type = type || 'info';
        ms = ms || 3200;
        var el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(function () { el.remove(); }, ms);
    };
}());

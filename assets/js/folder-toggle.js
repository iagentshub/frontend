// folder-toggle.js — botón icono-carpeta para mostrar/ocultar la columna de carpetas
'use strict';

var FolderToggle = (function () {
    var _SVG = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none">' +
        '<path d="M1.5 4.5A1 1 0 012.5 3.5h3.27l1.46 1.5H13.5A1 1 0 0114.5 6v6a1 1 0 01-1 1h-11a1 1 0 01-1-1V4.5z"' +
        ' stroke="currentColor" stroke-width="1.4" fill="none"/>' +
        '</svg>';

    function _getButtons(opts) {
        if (opts.btn) {
            var el = typeof opts.btn === 'string' ? document.getElementById(opts.btn) : opts.btn;
            return el ? [el] : [];
        }
        if (opts.btns) {
            return Array.from(document.querySelectorAll(opts.btns));
        }
        return [];
    }

    function _apply(panels, btns, visible) {
        panels.forEach(function (p) {
            if (p) p.classList.toggle('folder-panel--collapsed', !visible);
        });
        btns.forEach(function (btn) {
            if (!btn) return;
            btn.innerHTML = _SVG;
            btn.classList.toggle('folder-toggle-btn--on', visible);
            btn.title = visible ? 'Ocultar carpetas' : 'Mostrar carpetas';
        });
    }

    return {
        init: function (opts) {
            var btns = _getButtons(opts);
            var panels = (opts.panels || []).map(function (p) {
                return typeof p === 'string' ? document.getElementById(p) : p;
            }).filter(Boolean);
            var key = opts.key || 'gaia-folders-visible';

            var visible = localStorage.getItem(key) !== 'false';
            _apply(panels, btns, visible);

            btns.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    visible = !visible;
                    localStorage.setItem(key, String(visible));
                    _apply(panels, btns, visible);
                });
            });
        },
    };
}());

window.FolderToggle = FolderToggle;

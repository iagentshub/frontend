// filter_memory.js — barra de búsqueda para la página de memoria
'use strict';

var FilterMemory = (function () {
    var _state = { query: '' };
    var _onChange = null;

    var _SVG_SEARCH = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    var _SVG_CLEAR = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    function _render(mountEl) {
        mountEl.innerHTML =
            '<div class="fa-bar">' +
            '<div class="fa-search-wrap">' +
            _SVG_SEARCH +
            '<input id="fmem-search" class="fa-search-input" placeholder="Buscar por nombre de archivo…"' +
            ' value="' + esc(_state.query) + '" autocomplete="off"/>' +
            (_state.query
                ? '<button type="button" class="fa-search-clear" id="fmem-clear" aria-label="Limpiar">' + _SVG_CLEAR + '</button>'
                : '') +
            '</div>' +
            '</div>';
        _bindEvents(mountEl);
    }

    function _bindEvents(mountEl) {
        var inp = document.getElementById('fmem-search');
        if (inp) {
            inp.addEventListener('input', function (e) {
                _state.query = e.target.value;
                _notifyAndRender(mountEl);
            });
        }
        var clr = document.getElementById('fmem-clear');
        if (clr) {
            clr.addEventListener('click', function () {
                _state.query = '';
                _notifyAndRender(mountEl);
            });
        }
    }

    function _notifyAndRender(mountEl) {
        _render(mountEl);
        if (typeof _onChange === 'function') _onChange(_state);
    }

    return {
        init: function (opts) {
            var mountEl = typeof opts.mountEl === 'string'
                ? document.querySelector(opts.mountEl)
                : opts.mountEl;
            if (!mountEl) return;
            _onChange = opts.onChange || null;
            _state = { query: '' };
            _render(mountEl);
        },

        getFilter: function () {
            return { query: _state.query };
        },

        reset: function (mountEl) {
            _state = { query: '' };
            var el = typeof mountEl === 'string' ? document.querySelector(mountEl) : mountEl;
            if (el) _render(el);
        },
    };
}());

window.FilterMemory = FilterMemory;

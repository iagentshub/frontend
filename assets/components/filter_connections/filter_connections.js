// filter_connections.js — barra de filtros para la página de conexiones
'use strict';

var FilterConnections = (function () {
    var _state = { query: '', types: [] };
    var _onChange = null;
    var _TYPES = [];   // poblado dinámicamente desde Providers.list() en init()

    var _SVG_SEARCH = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    var _SVG_CLEAR = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    function _render(mountEl) {
        var hasAny = _state.query || _state.types.length > 0;
        mountEl.innerHTML =
            '<div class="fa-bar">' +
            '<div class="fa-search-wrap">' +
            _SVG_SEARCH +
            '<input id="fco-search" class="fa-search-input" placeholder="Buscar por nombre de conexión…"' +
            ' value="' + esc(_state.query) + '" autocomplete="off"/>' +
            (_state.query
                ? '<button type="button" class="fa-search-clear" id="fco-clear" aria-label="Limpiar">' + _SVG_CLEAR + '</button>'
                : '') +
            '</div>' +
            '<div class="fa-filter-group">' +
            _TYPES.map(function (t) {
                var active = _state.types.indexOf(t.id) !== -1;
                return '<button type="button"' +
                    ' class="fa-type-chip' + (active ? ' fa-type-chip--active fa-type-chip--' + t.id : '') + '"' +
                    ' data-type="' + esc(t.id) + '">' +
                    esc(t.label) +
                    '</button>';
            }).join('') +
            '</div>' +
            (hasAny
                ? '<button type="button" class="fa-clear-all" id="fco-clear-all">' + _SVG_CLEAR + 'Limpiar</button>'
                : '') +
            '</div>';
        _bindEvents(mountEl);
    }

    function _bindEvents(mountEl) {
        var inp = document.getElementById('fco-search');
        if (inp) {
            inp.addEventListener('input', function (e) {
                _state.query = e.target.value;
                _notifyAndRender(mountEl);
            });
        }

        var clr = document.getElementById('fco-clear');
        if (clr) {
            clr.addEventListener('click', function () {
                _state.query = '';
                _notifyAndRender(mountEl);
            });
        }

        mountEl.querySelectorAll('[data-type]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var t = btn.dataset.type;
                var idx = _state.types.indexOf(t);
                if (idx === -1) _state.types.push(t);
                else _state.types.splice(idx, 1);
                _notifyAndRender(mountEl);
            });
        });

        var clearAll = document.getElementById('fco-clear-all');
        if (clearAll) {
            clearAll.addEventListener('click', function () {
                _state = { query: '', types: [] };
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
            _TYPES = opts.types || [];
            _state = { query: '', types: [] };
            _render(mountEl);
        },

        getFilter: function () {
            return { query: _state.query, types: _state.types.slice() };
        },

        reset: function (mountEl) {
            _state = { query: '', types: [] };
            var el = typeof mountEl === 'string' ? document.querySelector(mountEl) : mountEl;
            if (el) _render(el);
        },
    };
}());

window.FilterConnections = FilterConnections;

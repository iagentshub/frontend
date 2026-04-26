// filter_skills.js — barra de búsqueda + filtros de scope y categoría para la página de skills
'use strict';

var FilterSkills = (function () {
    var _CATEGORIES = [
        { id: 'ai', label: '🤖 IA' },
        { id: 'messaging', label: '🗣️ Mensajería' },
        { id: 'notes', label: '📝 Notas' },
        { id: 'productivity', label: '✅ Productividad' },
        { id: 'dev', label: '💻 Dev' },
        { id: 'security', label: '🔒 Seguridad' },
        { id: 'media', label: '🎬 Media' },
        { id: 'data', label: '🌐 Datos' },
        { id: 'company', label: '🏢 Empresa' },
    ];

    var _state = { query: '', scope: '', categories: [] };
    var _onChange = null;

    var _SVG_SEARCH = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    var _SVG_CLEAR = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

    function _hasFilter() {
        return _state.query || _state.scope || _state.categories.length;
    }

    function _render(mountEl) {
        var scopeChips = [
            { id: '', label: 'Todas' },
            { id: 'public', label: '🟢 Públicas' },
            { id: 'private', label: '🔴 Privadas' },
        ].map(function (s) {
            var active = _state.scope === s.id ? ' fa-type-chip--active' : '';
            return '<button type="button" class="fa-type-chip' + active + '" data-fsk-scope="' + s.id + '">' + esc(s.label) + '</button>';
        }).join('');

        var catChips = _CATEGORIES.map(function (c) {
            var active = _state.categories.indexOf(c.id) >= 0 ? ' fa-type-chip--active' : '';
            return '<button type="button" class="fa-type-chip' + active + '" data-fsk-cat="' + c.id + '">' + esc(c.label) + '</button>';
        }).join('');

        var clearAllBtn = _hasFilter()
            ? '<button type="button" class="fa-clear-all" id="fsk-clear-all">Limpiar filtros</button>'
            : '';

        mountEl.innerHTML =
            '<div class="fa-bar">' +
            '<div class="fa-search-wrap">' +
            _SVG_SEARCH +
            '<input id="fsk-search" class="fa-search-input" placeholder="Buscar skill por nombre o descripción…"' +
            ' value="' + esc(_state.query) + '" autocomplete="off"/>' +
            (_state.query
                ? '<button type="button" class="fa-search-clear" id="fsk-clear" aria-label="Limpiar">' + _SVG_CLEAR + '</button>'
                : '') +
            '</div>' +
            '<div class="fa-chips-row">' + scopeChips + '</div>' +
            '<div class="fa-chips-row">' + catChips + '</div>' +
            (clearAllBtn ? '<div style="padding:4px 0">' + clearAllBtn + '</div>' : '') +
            '</div>';

        _bindEvents(mountEl);
    }

    function _bindEvents(mountEl) {
        var inp = document.getElementById('fsk-search');
        if (inp) {
            inp.addEventListener('input', function (e) {
                _state.query = e.target.value;
                _notifyAndRender(mountEl);
            });
        }
        var clr = document.getElementById('fsk-clear');
        if (clr) {
            clr.addEventListener('click', function () {
                _state.query = '';
                _notifyAndRender(mountEl);
            });
        }
        var clrAll = document.getElementById('fsk-clear-all');
        if (clrAll) {
            clrAll.addEventListener('click', function () {
                _state = { query: '', scope: '', categories: [] };
                _notifyAndRender(mountEl);
            });
        }
        mountEl.querySelectorAll('[data-fsk-scope]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                _state.scope = btn.dataset.fskScope;
                _notifyAndRender(mountEl);
            });
        });
        mountEl.querySelectorAll('[data-fsk-cat]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.dataset.fskCat;
                var idx = _state.categories.indexOf(id);
                if (idx >= 0) {
                    _state.categories.splice(idx, 1);
                } else {
                    _state.categories.push(id);
                }
                _notifyAndRender(mountEl);
            });
        });
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
            _state = { query: '', scope: '', categories: [] };
            _render(mountEl);
        },

        getFilter: function () {
            return { query: _state.query, scope: _state.scope, categories: _state.categories.slice() };
        },

        reset: function (mountEl) {
            _state = { query: '', scope: '', categories: [] };
            var el = typeof mountEl === 'string' ? document.querySelector(mountEl) : mountEl;
            if (el) _render(el);
        },
    };
}());

window.FilterSkills = FilterSkills;

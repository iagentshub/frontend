// filter_connections.js — barra de filtros para la página de conexiones
'use strict';

var FilterConnections = (function () {
    var _state = { query: '', types: [], labels: [] };
    var _onChange = null;
    var _TYPES = [];
    var _mountEl = null;

    var _SVG_SEARCH = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    var _SVG_CLEAR = '<svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

    /** Grupos de etiquetas para filtro (excluye visibility y origin). */
    function _labelGroups() {
        if (!window.LABELS) return [];
        return window.LABELS.groups().filter(function (g) {
            return g.id !== 'visibility' && g.id !== 'origin';
        });
    }

    /** Valor activo del grupo en _state.labels. */
    function _activeForGroup(gid) {
        if (!window.LABELS) return '';
        return _state.labels.find(function (k) {
            return window.LABELS.getGroupId(k) === gid;
        }) || '';
    }

    /** Construye los <select> de etiquetas por grupo. */
    function _buildLabelSelects() {
        var groups = _labelGroups();
        if (!groups.length) return '';
        return groups.map(function (g) {
            var title = window.t ? window.t(g.i18nKey) : g.id;
            var active = _activeForGroup(g.id);
            var lbl = active && window.LABELS ? window.LABELS.getDef(active) : null;
            var lc = lbl ? lbl.color : '';
            var style = lc ? ' style="--lc:' + lc + '"' : '';
            var opts = '<option value="">' + esc(title) + '…</option>' +
                g.labels.map(function (l) {
                    var label = window.LABELS ? window.LABELS.getLabel(l.key) : l.key;
                    return '<option value="' + esc(l.key) + '"' + (l.key === active ? ' selected' : '') + '>' +
                        esc(label) + '</option>';
                }).join('');
            return '<div class="fco-lbl-sel-wrap' + (active ? ' fco-lbl-sel-wrap--on' : '') + '"' + style + '>' +
                '<select class="fco-lbl-select" data-lgroup="' + esc(g.id) + '">' + opts + '</select>' +
                '</div>';
        }).join('');
    }

    function _render(mountEl) {
        var inp = document.getElementById('fco-search');
        var hadFocus = inp && document.activeElement === inp;
        var cursor = hadFocus ? inp.selectionStart : null;

        var hasAny = _state.query || _state.types.length > 0 || _state.labels.length > 0;

        var chips = _TYPES.map(function (t_) {
            var active = _state.types.indexOf(t_.id) !== -1;
            return '<button type="button" class="fco-chip' + (active ? ' fco-chip--active' : '') +
                '" data-type="' + esc(t_.id) + '">' + esc(t_.label) + '</button>';
        }).join('');

        var placeholder = window.t ? window.t('connections.filter.search_placeholder') : 'Buscar conexión…';
        var clearLabel = window.t ? window.t('actions.clear') : 'Limpiar';
        var clearAria = window.t ? window.t('search.clear_aria') : 'Limpiar';

        mountEl.innerHTML =
            '<div class="fco-bar">' +
            '<div class="fco-top-row">' +
            '<div class="fco-search-wrap">' +
            _SVG_SEARCH +
            '<input id="fco-search" class="fco-search-input" placeholder="' + placeholder + '"' +
            ' value="' + esc(_state.query) + '" autocomplete="off"/>' +
            (_state.query ? '<button type="button" class="fco-search-clear" id="fco-clear" aria-label="' + clearAria + '">' + _SVG_CLEAR + '</button>' : '') +
            '</div>' +
            _buildLabelSelects() +
            (hasAny ? '<button type="button" class="fco-clear-all" id="fco-clear-all">' + clearLabel + '</button>' : '') +
            '</div>' +
            (chips ? '<div class="fco-chips-row">' + chips + '</div>' : '') +
            '</div>';

        _bindEvents(mountEl);

        if (hadFocus) {
            var ni = document.getElementById('fco-search');
            if (ni) { ni.focus(); if (cursor !== null) try { ni.setSelectionRange(cursor, cursor); } catch (e) { } }
        }
    }

    function _bindEvents(mountEl) {
        var inp = document.getElementById('fco-search');
        if (inp) inp.addEventListener('input', function (e) {
            _state.query = e.target.value;
            _notifyAndRender(mountEl);
        });

        var clr = document.getElementById('fco-clear');
        if (clr) clr.addEventListener('click', function () {
            _state.query = '';
            _notifyAndRender(mountEl);
        });

        mountEl.querySelectorAll('[data-type]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var t = btn.dataset.type;
                var idx = _state.types.indexOf(t);
                if (idx === -1) _state.types.push(t); else _state.types.splice(idx, 1);
                _notifyAndRender(mountEl);
            });
        });

        // ── Selects de etiquetas por grupo ────────────────────────────────
        mountEl.querySelectorAll('.fco-lbl-select').forEach(function (sel) {
            sel.addEventListener('change', function () {
                var gid = sel.dataset.lgroup;
                // Quitar etiquetas previas del grupo
                if (window.LABELS) {
                    _state.labels = _state.labels.filter(function (k) {
                        return window.LABELS.getGroupId(k) !== gid;
                    });
                }
                if (sel.value) _state.labels.push(sel.value);
                _notifyAndRender(mountEl);
            });
        });

        var clearAll = document.getElementById('fco-clear-all');
        if (clearAll) clearAll.addEventListener('click', function () {
            _state = { query: '', types: [], labels: [] };
            _notifyAndRender(mountEl);
        });
    }

    function _notifyAndRender(mountEl) {
        _render(mountEl);
        if (typeof _onChange === 'function') _onChange(_state);
    }

    return {
        init: function (opts) {
            _mountEl = typeof opts.mountEl === 'string' ? document.querySelector(opts.mountEl) : opts.mountEl;
            if (!_mountEl) return;
            _onChange = opts.onChange || null;
            _TYPES = opts.types || [];
            _state = { query: '', types: [], labels: [] };
            _render(_mountEl);
        },
        setTypes: function (newTypes, mountElSel) {
            _TYPES = newTypes || [];
            _state.types = [];
            _state.labels = [];
            var el = mountElSel ? (typeof mountElSel === 'string' ? document.querySelector(mountElSel) : mountElSel) : _mountEl;
            if (el) _render(el);
            if (typeof _onChange === 'function') _onChange(_state);
        },
        getFilter: function () {
            return { query: _state.query, types: _state.types.slice(), labels: _state.labels.slice() };
        },
        reset: function (mountEl) {
            _state = { query: '', types: [], labels: [] };
            var el = typeof mountEl === 'string' ? document.querySelector(mountEl) : (mountEl || _mountEl);
            if (el) _render(el);
        },
    };
}());

window.FilterConnections = FilterConnections;

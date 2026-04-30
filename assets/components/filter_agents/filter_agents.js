// filter_agents.js — barra de filtros para la galería de agentes
'use strict';

var FilterAgents = (function () {
    var _SCOPE_TABS = [
        { val: null,      label: 'Todos',       icon: '' },
        { val: 'private', label: 'Mis agentes', icon: '' },
        { val: 'public',  label: 'Públicos',    icon: '' },
    ];

    var _state = { query: '', skillIds: [], connIds: [], memory: null, scope: null };
    var _data = { skills: [], connections: [] };
    var _onChange = null;
    var _openPanel = null; // 'skills' | 'conn' | 'memory' | null
    var _panelSearch = { skills: '', conn: '' }; // preservar búsqueda al re-renderizar

    // ── SVGs ─────────────────────────────────────────────────────────────
    var _SVG_SEARCH  = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    var _SVG_CHEVRON = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var _SVG_CLEAR   = '<svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    var _SVG_CHECK   = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    // ── Render ────────────────────────────────────────────────────────────
    function _render(mountEl) {
        var srch = document.getElementById('fa-search');
        var hadFocus = srch && document.activeElement === srch;
        var cursor   = hadFocus ? srch.selectionStart : null;

        var hasSk  = _state.skillIds.length > 0;
        var hasConn = _state.connIds.length > 0;
        var hasMem  = _state.memory !== null;
        var hasScp  = _state.scope !== null;
        var hasAny  = _state.query || hasSk || hasConn || hasMem || hasScp;

        var scopeTabs = _SCOPE_TABS.map(function (t) {
            var active = _state.scope === t.val;
            return '<button type="button" class="fa-scope-tab' + (active ? ' fa-scope-tab--active' : '') + '" data-scope="' + (t.val || '') + '">' +
                t.icon + esc(t.label) +
                '</button>';
        }).join('');

        mountEl.innerHTML =
            '<div class="fa-bar" id="fa-bar">' +
              '<div class="fa-search-wrap">' +
                _SVG_SEARCH +
                '<input id="fa-search" class="fa-search-input" placeholder="Buscar por nombre o descripción..." value="' + esc(_state.query) + '" autocomplete="off"/>' +
                (_state.query ? '<button type="button" class="fa-search-clear" id="fa-search-clear" aria-label="Limpiar búsqueda">' + _SVG_CLEAR + '</button>' : '') +
              '</div>' +

              '<div class="fa-scope-tabs">' + scopeTabs + '</div>' +

              '<div class="fa-filter-group">' +

              '<div class="fa-dropdown-wrap" id="fa-wrap-skills">' +
                '<button type="button" class="fa-filter-btn' + (hasSk ? ' fa-filter-btn--active' : '') + '" id="fa-btn-skills">' +
                  'Skills' + (hasSk ? '<span class="fa-filter-count">' + _state.skillIds.length + '</span>' : '') + _SVG_CHEVRON +
                '</button>' +
                (_openPanel === 'skills' ? _renderSkillsPanel() : '') +
              '</div>' +

              '<div class="fa-dropdown-wrap" id="fa-wrap-conn">' +
                '<button type="button" class="fa-filter-btn' + (hasConn ? ' fa-filter-btn--active' : '') + '" id="fa-btn-conn">' +
                  'Conexión' + (hasConn ? '<span class="fa-filter-count">' + _state.connIds.length + '</span>' : '') + _SVG_CHEVRON +
                '</button>' +
                (_openPanel === 'conn' ? _renderConnPanel() : '') +
              '</div>' +

              '<div class="fa-dropdown-wrap" id="fa-wrap-memory">' +
                '<button type="button" class="fa-filter-btn' + (hasMem ? ' fa-filter-btn--active' : '') + '" id="fa-btn-memory">' +
                  'Memoria' + (hasMem ? '<span class="fa-filter-count">1</span>' : '') + _SVG_CHEVRON +
                '</button>' +
                (_openPanel === 'memory' ? _renderMemoryPanel() : '') +
              '</div>' +

              '</div>' +

              (hasAny ? '<button type="button" class="fa-clear-all" id="fa-clear-all">× Limpiar</button>' : '') +
            '</div>';

        _bindEvents(mountEl);

        if (hadFocus) {
            var ni = document.getElementById('fa-search');
            if (ni) {
                ni.focus();
                if (cursor !== null) try { ni.setSelectionRange(cursor, cursor); } catch (e) {}
            }
        }
    }

    function _renderSkillsPanel() {
        var q = _panelSearch.skills;
        var qLow = q.toLowerCase();
        if (!_data.skills.length) {
            return '<div class="fa-panel"><span class="fa-panel-empty">Sin skills disponibles</span></div>';
        }
        return '<div class="fa-panel fa-panel--skills" id="fa-panel-skills">' +
            _renderPanelSearch('skills', 'Buscar skill…') +
            '<div class="fa-panel-list" id="fa-plist-skills">' +
            _data.skills.map(function (sk) {
                var active = _state.skillIds.indexOf(sk.id) !== -1;
                var show = active || (qLow !== '' && sk.name.toLowerCase().indexOf(qLow) !== -1);
                return '<div class="fa-option' + (active ? ' fa-option--active' : '') + '"' +
                    ' data-filter="skill" data-id="' + esc(sk.id) + '" data-name="' + esc(sk.name.toLowerCase()) + '"' +
                    (show ? '' : ' style="display:none"') + '>' +
                    '<span class="fa-option-check">' + (active ? _SVG_CHECK : '') + '</span>' +
                    '<span class="fa-option-label">' + esc(sk.name) + '</span>' +
                    '</div>';
            }).join('') +
            '</div>' +
            '</div>';
    }

    function _renderConnPanel() {
        var q = _panelSearch.conn;
        var qLow = q.toLowerCase();
        if (!_data.connections.length) {
            return '<div class="fa-panel"><span class="fa-panel-empty">Sin conexiones disponibles</span></div>';
        }
        var TYPE_LABELS = { openai: 'OpenAI', claude: 'Claude', gemini: 'Gemini', ollama: 'Ollama' };
        return '<div class="fa-panel fa-panel--conn" id="fa-panel-conn">' +
            _renderPanelSearch('conn', 'Buscar conexión…') +
            '<div class="fa-panel-list" id="fa-plist-conn">' +
            _data.connections.map(function (c) {
                var active = _state.connIds.indexOf(c.id) !== -1;
                var label = c.name + ' · ' + (TYPE_LABELS[c.type] || c.type);
                var show = active || (qLow !== '' && label.toLowerCase().indexOf(qLow) !== -1);
                return '<div class="fa-option' + (active ? ' fa-option--active' : '') + '"' +
                    ' data-filter="conn" data-id="' + esc(c.id) + '" data-name="' + esc(label.toLowerCase()) + '"' +
                    (show ? '' : ' style="display:none"') + '>' +
                    '<span class="fa-option-check">' + (active ? _SVG_CHECK : '') + '</span>' +
                    '<span class="fa-option-label">' + esc(label) + '</span>' +
                    '</div>';
            }).join('') +
            '</div>' +
            '</div>';
    }

    function _renderMemoryPanel() {
        var opts = [
            { val: 'true', label: 'Con memoria activa' },
            { val: 'false', label: 'Sin memoria' },
        ];
        return '<div class="fa-panel fa-panel--memory" id="fa-panel-memory">' +
            opts.map(function (o) {
                var active = String(_state.memory) === o.val;
                return '<label class="fa-option' + (active ? ' fa-option--active' : '') + '">' +
                    '<span class="fa-option-check">' + (active ? _SVG_CHECK : '') + '</span>' +
                    '<span class="fa-option-label">' + esc(o.label) + '</span>' +
                    '<input type="radio" name="fa-memory" data-filter="memory" data-val="' + o.val + '"' + (active ? ' checked' : '') + ' style="display:none"/>' +
                    '</label>';
            }).join('') +
            '</div>';
    }

    // Genera el input de búsqueda dentro del panel (skills / conn)
    function _renderPanelSearch(key, placeholder) {
        return '<div class="fa-panel-search-wrap">' +
            _SVG_SEARCH +
            '<input class="fa-panel-search" id="fa-psearch-' + key + '"' +
            ' placeholder="' + placeholder + '"' +
            ' autocomplete="off" value="' + esc(_panelSearch[key] || '') + '"/>' +
            '</div>';
    }

    // Filtra las opciones del panel directamente en el DOM (sin re-render)
    function _filterPanelItems(key, q) {
        var list = document.getElementById('fa-plist-' + key);
        if (!list) return;
        var qLow = q.toLowerCase();
        list.querySelectorAll('.fa-option').forEach(function (opt) {
            var isActive = opt.classList.contains('fa-option--active');
            opt.style.display = (isActive || (qLow !== '' && (opt.dataset.name || '').indexOf(qLow) !== -1)) ? '' : 'none';
        });
    }

    // ── Events ────────────────────────────────────────────────────────────
    function _bindEvents(mountEl) {
        // Search input
        var searchEl = document.getElementById('fa-search');
        if (searchEl) {
            searchEl.addEventListener('input', function (e) {
                _state.query = e.target.value;
                _notifyAndRender(mountEl, null);
            });
        }

        // Search clear
        var clearSearch = document.getElementById('fa-search-clear');
        if (clearSearch) {
            clearSearch.addEventListener('click', function () {
                _state.query = '';
                _notifyAndRender(mountEl, null);
            });
        }

        // Scope tabs
        mountEl.querySelectorAll('.fa-scope-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var val = tab.dataset.scope || null;
                _state.scope = val;
                _openPanel = null;
                _notifyAndRender(mountEl, null);
            });
        });

        // Filter buttons toggle panels
        ['skills', 'conn', 'memory'].forEach(function (key) {
            var btn = document.getElementById('fa-btn-' + key);
            if (btn) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var closing = _openPanel === key;
                    if (closing) _panelSearch[key] = '';
                    _openPanel = closing ? null : key;
                    _render(mountEl);
                    // Auto-foco al input de búsqueda del panel
                    if (_openPanel && key !== 'memory') {
                        var psearch = document.getElementById('fa-psearch-' + key);
                        if (psearch) psearch.focus();
                    }
                });
            }
        });

        // Panel search inputs (filtran el DOM sin re-render para no perder el foco)
        ['skills', 'conn'].forEach(function (key) {
            var inp = document.getElementById('fa-psearch-' + key);
            if (!inp) return;
            inp.addEventListener('input', function (e) {
                _panelSearch[key] = e.target.value;
                _filterPanelItems(key, e.target.value);
            });
        });

        // Opción skill — mousedown para no perder el foco del input de búsqueda
        mountEl.querySelectorAll('.fa-option[data-filter="skill"]').forEach(function (opt) {
            opt.addEventListener('mousedown', function (e) {
                e.preventDefault(); // evita que el input pierda foco
                var id = opt.dataset.id;
                var idx = _state.skillIds.indexOf(id);
                if (idx === -1) _state.skillIds.push(id);
                else _state.skillIds.splice(idx, 1);
                _notifyAndRender(mountEl, 'skills');
            });
        });

        // Opción conexión
        mountEl.querySelectorAll('.fa-option[data-filter="conn"]').forEach(function (opt) {
            opt.addEventListener('mousedown', function (e) {
                e.preventDefault();
                var id = opt.dataset.id;
                var idx = _state.connIds.indexOf(id);
                if (idx === -1) _state.connIds.push(id);
                else _state.connIds.splice(idx, 1);
                _notifyAndRender(mountEl, 'conn');
            });
        });

        // Opción memoria (no tiene search, se usa click normal)
        mountEl.querySelectorAll('input[data-filter="memory"]').forEach(function (inp) {
            inp.parentElement.addEventListener('click', function () {
                var val = inp.dataset.val === 'true';
                _state.memory = _state.memory === val ? null : val;
                _notifyAndRender(mountEl, null);
            });
        });

        // Clear all
        var clearAll = document.getElementById('fa-clear-all');
        if (clearAll) {
            clearAll.addEventListener('click', function () {
                _state = { query: '', skillIds: [], connIds: [], memory: null, scope: null };
                _panelSearch = { skills: '', conn: '' };
                _openPanel = null;
                _notifyAndRender(mountEl, null);
            });
        }

        // Click outside to close panels
        document.addEventListener('click', function _outsideHandler(e) {
            if (_openPanel === null) return;
            var bar = document.getElementById('fa-bar');
            if (bar && !bar.contains(e.target)) {
                _panelSearch[_openPanel] = '';
                _openPanel = null;
                _render(mountEl);
                document.removeEventListener('click', _outsideHandler);
            }
        });
    }

    // Re-renderiza y, si corresponde, restaura foco + búsqueda en el panel abierto
    function _notifyAndRender(mountEl, restorePanel) {
        _render(mountEl);
        if (restorePanel && _openPanel === restorePanel) {
            var inp = document.getElementById('fa-psearch-' + restorePanel);
            if (inp) {
                inp.focus();
                _filterPanelItems(restorePanel, _panelSearch[restorePanel] || '');
            }
        }
        if (typeof _onChange === 'function') _onChange(_state);
    }

    // ── Public API ────────────────────────────────────────────────────────
    return {
        init: function (opts) {
            // opts: { mountEl, skills, connections, onChange }
            var mountEl = typeof opts.mountEl === 'string'
                ? document.querySelector(opts.mountEl)
                : opts.mountEl;
            if (!mountEl) return;
            _data.skills = opts.skills || [];
            _data.connections = opts.connections || [];
            _onChange = opts.onChange || null;
            _state = { query: '', skillIds: [], connIds: [], memory: null };
            _openPanel = null;
            _render(mountEl);
            return mountEl;
        },

        setData: function (skills, connections) {
            _data.skills = skills || [];
            _data.connections = connections || [];
        },

        getFilter: function () {
            return {
                query: _state.query,
                skillIds: _state.skillIds.slice(),
                connIds: _state.connIds.slice(),
                memory: _state.memory,
                scope: _state.scope,
            };
        },

        reset: function (mountEl) {
            _state = { query: '', skillIds: [], connIds: [], memory: null, scope: null };
            _panelSearch = { skills: '', conn: '' };
            _openPanel = null;
            var el = typeof mountEl === 'string' ? document.querySelector(mountEl) : mountEl;
            if (el) _render(el);
        },
    };
}());

window.FilterAgents = FilterAgents;

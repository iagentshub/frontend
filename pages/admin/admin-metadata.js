// admin-metadata.js — Página Metadata del sistema
// Autocontenida: no depende del estado interno de admin-logs.js
'use strict';
(function () {

    // ═══ TABS ════════════════════════════════════════════════════════════════
    function _switchTab(tab) {
        document.querySelectorAll('[data-meta-tab]').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.metaTab === tab);
        });
        var pl = document.getElementById('meta-panel-logs');
        var pt = document.getElementById('meta-panel-tables');
        if (pl) pl.style.display = tab === 'logs' ? '' : 'none';
        if (pt) pt.style.display = tab === 'tables' ? '' : 'none';
        if (tab === 'tables') _initTables();
    }
    window._metaSwitchTab = _switchTab;

    // ═══ LOG SUMMARY ════════════════════════════════════════════════════════
    function _fmtDay(date) {
        var p = date.split('-');
        return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : date;
    }

    function _loadLogSummary() {
        var grid = document.getElementById('logs-summary-grid');
        if (!grid) return;
        grid.innerHTML = '<div class="lsc-loading">…</div>';
        api.get('/api/admin/logs/summary').then(function (items) {
            grid.innerHTML = '';
            if (!items || !items.length) {
                grid.innerHTML = '<p class="logs-count">Sin logs registrados.</p>';
                return;
            }
            items.forEach(function (item) {
                var fmtDate = _fmtDay(item.date);
                var card = document.createElement('div');
                card.className = 'log-summary-card';
                card.innerHTML =
                    '<div class="lsc-header"><span class="lsc-date">' + fmtDate + '</span></div>' +
                    '<div class="lsc-lines">' + (item.lines || 0) + ' entradas</div>' +
                    '<table class="lsc-breakdown"><thead><tr><th></th><th>⚠</th><th>✕</th></tr></thead><tbody>' +
                    '<tr><td><span class="log-badge log-badge-be">BE</span></td>' +
                    '<td class="' + (item.be_warnings ? 'lsc-bw' : 'lsc-zero') + '">' + (item.be_warnings || 0) + '</td>' +
                    '<td class="' + (item.be_errors ? 'lsc-be' : 'lsc-zero') + '">' + (item.be_errors || 0) + '</td></tr>' +
                    '<tr><td><span class="log-badge log-badge-fe">FE</span></td>' +
                    '<td class="' + (item.fe_warnings ? 'lsc-bw' : 'lsc-zero') + '">' + (item.fe_warnings || 0) + '</td>' +
                    '<td class="' + (item.fe_errors ? 'lsc-be' : 'lsc-zero') + '">' + (item.fe_errors || 0) + '</td></tr>' +
                    '</tbody></table>';
                card.addEventListener('click', (function (d, fd) { return function () { _openLogModal(d, fd); }; })(item.date, fmtDate));
                grid.appendChild(card);
            });
        }).catch(function () {
            grid.innerHTML = '<p class="logs-count" style="color:var(--danger,#ef4444)">Error al cargar resumen.</p>';
        });
    }

    // ═══ LOG MODAL ══════════════════════════════════════════════════════════
    var _logLines = [], _logLevel = '', _logSource = '', _logSearch = '', _logTimer = null;
    var _LEVEL_CLS = { DEBUG: 'log-level-debug', INFO: 'log-level-info', OK: 'log-level-ok', WARNING: 'log-level-warning', ERROR: 'log-level-error' };

    function _esc(s) {
        return String(s == null ? '-' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function _renderLogTable() {
        var search = _logSearch.toLowerCase();
        var visible = _logLines.filter(function (l) {
            if (_logLevel && l.level !== _logLevel) return false;
            if (_logSource && l.source !== _logSource) return false;
            if (search && (l.ip + l.username + l.summary + l.date + l.time).toLowerCase().indexOf(search) === -1) return false;
            return true;
        });
        var tbody = document.getElementById('logs-tbody');
        if (!tbody) return;
        if (!visible.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="logs-td logs-td-empty">Sin resultados.</td></tr>';
        } else {
            tbody.innerHTML = visible.map(function (l) {
                var cls = _LEVEL_CLS[l.level] || 'log-level-debug';
                var svc = l.source === 'FE' ? '<span class="log-badge log-badge-fe">FE</span>' : '<span class="log-badge log-badge-be">BE</span>';
                return '<tr>' +
                    '<td class="logs-td logs-td-date">' + _esc(l.date) + '</td>' +
                    '<td class="logs-td logs-td-time">' + _esc(l.time) + '</td>' +
                    '<td class="logs-td"><span class="log-level ' + cls + '">' + _esc(l.level) + '</span></td>' +
                    '<td class="logs-td" style="cursor:pointer;color:var(--accent)" data-log-ip="' + _esc(l.ip) + '">' + _esc(l.ip) + '</td>' +
                    '<td class="logs-td" style="cursor:pointer;color:var(--accent)" data-log-user="' + _esc(l.username) + '">' + _esc(l.username) + '</td>' +
                    '<td class="logs-td">' + svc + '</td>' +
                    '<td class="logs-td logs-td-msg">' + _esc(l.summary) + '</td>' +
                    '</tr>';
            }).join('');
        }
        var cnt = document.getElementById('logs-count');
        if (cnt) cnt.textContent = visible.length + ' / ' + _logLines.length + ' entradas';
    }

    function _loadLogData(date) {
        var tbody = document.getElementById('logs-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="logs-td logs-td-empty">Cargando…</td></tr>';
        api.get('/api/admin/logs?date_from=' + date + '&date_to=' + date + '&page_size=500').then(function (data) {
            _logLines = (data.items || []).map(function (r) {
                return { date: r.date, time: r.time, level: r.level, ip: r.ip || '-', username: r.username || '-', source: r.source, summary: r.summary || '' };
            });
            _renderLogTable();
            var dl = document.getElementById('btn-logs-download');
            if (dl) {
                var csv = ['Fecha,Hora,Nivel,IP,Usuario,Fuente,Accion'].concat(_logLines.map(function (l) {
                    return [l.date, l.time, l.level, l.ip, l.username, l.source, '"' + l.summary.replace(/"/g, '""') + '"'].join(',');
                })).join('\n');
                dl.style.display = '';
                dl.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                dl.download = date + '.csv';
            }
        }).catch(function () {
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="logs-td logs-td-empty" style="color:var(--danger,#ef4444)">Error al cargar.</td></tr>';
        });
    }

    function _openLogModal(date, fmtDate) {
        _logLevel = ''; _logSource = ''; _logSearch = '';
        var modal = document.getElementById('logs-modal');
        var title = document.getElementById('logs-modal-title');
        if (modal) modal.style.display = '';
        if (title) title.textContent = 'Logs — ' + fmtDate;
        document.body.style.overflow = 'hidden';
        ['logs-level-select', 'logs-service-select', 'logs-search'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
        _loadLogData(date);
    }

    function _closeLogModal() {
        var modal = document.getElementById('logs-modal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function _bindLogModal() {
        var close = document.getElementById('btn-logs-modal-close');
        if (close) close.addEventListener('click', _closeLogModal);
        var modal = document.getElementById('logs-modal');
        if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) _closeLogModal(); });
        var lvl = document.getElementById('logs-level-select');
        var svc = document.getElementById('logs-service-select');
        var si = document.getElementById('logs-search');
        if (lvl) lvl.onchange = function () { _logLevel = lvl.value; _renderLogTable(); };
        if (svc) svc.onchange = function () { _logSource = svc.value; _renderLogTable(); };
        if (si) si.addEventListener('input', function () { clearTimeout(_logTimer); _logTimer = setTimeout(function () { _logSearch = si.value; _renderLogTable(); }, 200); });
        var tbody = document.getElementById('logs-tbody');
        if (tbody) tbody.addEventListener('click', function (e) {
            var ip = e.target.closest('[data-log-ip]');
            var user = e.target.closest('[data-log-user]');
            if (ip && ip.dataset.logIp !== '-') { if (si) si.value = ip.dataset.logIp; _logSearch = ip.dataset.logIp; _renderLogTable(); }
            else if (user && user.dataset.logUser !== '-') { if (si) si.value = user.dataset.logUser; _logSearch = user.dataset.logUser; _renderLogTable(); }
        });
        document.querySelectorAll('.logs-th.sortable').forEach(function (th) {
            th.addEventListener('click', function () {
                var col = th.dataset.col, dir = th._dir || 1;
                _logLines.sort(function (a, b) { var av = a[col] || '', bv = b[col] || ''; return av < bv ? -dir : av > bv ? dir : 0; });
                th._dir = -dir;
                _renderLogTable();
            });
        });
    }

    // ═══ TABLES ═════════════════════════════════════════════════════════════
    var _allTables = [], _tablesInit = false;

    function _fmtBytes(b) {
        if (!b || isNaN(b)) return null;
        if (b < 1024) return b + '\u00a0B';
        if (b < 1048576) return (b / 1024).toFixed(1) + '\u00a0KB';
        return (b / 1048576).toFixed(1) + '\u00a0MB';
    }

    function _initTables() {
        if (_tablesInit) { _renderTableCards(); return; }
        _tablesInit = true;
        var grid = document.getElementById('meta-tables-grid');
        if (grid) grid.innerHTML = '<p style="color:var(--text-2);grid-column:1/-1">Cargando…</p>';
        api.get('/api/admin/metadata/tables').then(function (rows) {
            _allTables = rows || [];
            _renderTableCards();
        }).catch(function () {
            var g = document.getElementById('meta-tables-grid');
            if (g) g.innerHTML = '<p style="color:var(--danger,#ef4444);grid-column:1/-1">Error al cargar tablas.</p>';
        });
    }

    function _renderTableCards() {
        var q = ((document.getElementById('meta-table-search') || {}).value || '').toLowerCase();
        var filtered = _allTables.filter(function (t) { return !q || t.name.toLowerCase().indexOf(q) !== -1; });
        var grid = document.getElementById('meta-tables-grid');
        var cnt = document.getElementById('meta-table-count');
        if (cnt) cnt.textContent = filtered.length + ' de ' + _allTables.length + ' tablas';
        if (!grid) return;
        if (!filtered.length) { grid.innerHTML = '<p style="color:var(--text-2);grid-column:1/-1">Sin resultados.</p>'; return; }
        grid.innerHTML = filtered.map(function (r) {
            var size = _fmtBytes(r.size_bytes);
            var empty = !r.rows;
            return '<div class="admin-stat-card" style="flex-direction:column;gap:5px;padding:16px 18px;cursor:pointer" ' +
                'onclick="window._metaOpenTable(\'' + r.name + '\')" ' +
                'onmouseenter="this.style.borderColor=\'var(--accent)\'" ' +
                'onmouseleave="this.style.borderColor=\'\'">' +
                '<span style="font-family:monospace;font-size:0.72rem;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%" title="' + r.name + '">' + r.name + '</span>' +
                '<span style="font-size:1.55rem;font-weight:700;line-height:1.1;color:' + (empty ? 'var(--text-2)' : 'var(--ink)') + '">' + (r.rows || 0).toLocaleString() + '</span>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;margin-top:2px">' +
                '<span style="font-size:0.7rem;color:var(--text-2)">' + (r.col_count || '?') + '\u00a0col</span>' +
                (size ? '<span style="font-size:0.7rem;color:var(--text-2)">' + size + '</span>' : '<span></span>') +
                '</div></div>';
        }).join('');
    }
    window._metaFilterTables = _renderTableCards;

    // ═══ TABLE BROWSER DIALOG ═══════════════════════════════════════════════
    var _tbl = null, _tblPage = 1, _tblPageSize = 50, _tblQ = '';

    function _openTableDialog(name) {
        _tbl = name; _tblPage = 1; _tblQ = '';
        var dialog = document.getElementById('meta-table-dialog');
        var title = document.getElementById('meta-table-dialog-title');
        if (dialog) dialog.style.display = '';
        if (title) title.textContent = name;
        document.body.style.overflow = 'hidden';
        var si = document.getElementById('meta-table-search-data');
        if (si) si.value = '';
        _loadTableData();
    }

    function _closeTableDialog() {
        var d = document.getElementById('meta-table-dialog');
        if (d) d.style.display = 'none';
        document.body.style.overflow = '';
    }

    function _loadTableData() {
        if (!_tbl) return;
        var wrap = document.getElementById('meta-table-data-wrap');
        if (wrap) wrap.innerHTML = '<p style="text-align:center;padding:28px;color:var(--text-2)">Cargando…</p>';
        var qs = 'page=' + _tblPage + '&page_size=' + _tblPageSize;
        if (_tblQ) qs += '&q=' + encodeURIComponent(_tblQ);
        api.get('/api/admin/metadata/tables/' + encodeURIComponent(_tbl) + '/data?' + qs).then(function (data) {
            var cols = data.columns || [], rows = data.rows || [], total = data.total || 0, pages = data.pages || 0;
            var html = '<div style="overflow:auto"><table class="logs-table" style="min-width:max-content;width:100%"><thead><tr>' +
                cols.map(function (c) { return '<th class="logs-th" style="white-space:nowrap">' + _esc(c) + '</th>'; }).join('') +
                '</tr></thead><tbody>';
            html += rows.length
                ? rows.map(function (row) { return '<tr>' + row.map(function (cell) { return '<td class="logs-td" style="white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis">' + _esc(cell) + '</td>'; }).join('') + '</tr>'; }).join('')
                : '<tr><td colspan="' + cols.length + '" class="logs-td logs-td-empty">Sin datos.</td></tr>';
            html += '</tbody></table></div>';
            html += '<div style="display:flex;align-items:center;gap:8px;justify-content:center;padding:10px;border-top:1px solid var(--border);flex-shrink:0">' +
                '<button class="btn btn-ghost btn-sm" id="tbl-btn-prev" ' + (_tblPage <= 1 ? 'disabled' : '') + '">← Ant</button>' +
                '<span style="font-size:0.78rem;color:var(--text-2)">Pág. ' + _tblPage + (pages > 1 ? ' de ' + pages : '') + ' · ' + total.toLocaleString() + ' filas</span>' +
                '<button class="btn btn-ghost btn-sm" id="tbl-btn-next" ' + (_tblPage >= pages ? 'disabled' : '') + '">Sig →</button>' +
                '</div>';
            if (wrap) {
                wrap.innerHTML = html;
                var prev = document.getElementById('tbl-btn-prev');
                var next = document.getElementById('tbl-btn-next');
                if (prev) prev.addEventListener('click', function () { _tblPage--; _loadTableData(); });
                if (next) next.addEventListener('click', function () { _tblPage++; _loadTableData(); });
            }
        }).catch(function () {
            if (wrap) wrap.innerHTML = '<p style="text-align:center;padding:28px;color:var(--danger,#ef4444)">Error al cargar datos.</p>';
        });
    }

    function _bindTableDialog() {
        var close = document.getElementById('meta-table-dialog-close');
        if (close) close.addEventListener('click', _closeTableDialog);
        var dialog = document.getElementById('meta-table-dialog');
        if (dialog) dialog.addEventListener('click', function (e) { if (e.target === dialog) _closeTableDialog(); });
        var si = document.getElementById('meta-table-search-data');
        var btn = document.getElementById('meta-table-search-btn');
        function _doSearch() { _tblQ = si ? si.value.trim() : ''; _tblPage = 1; _loadTableData(); }
        if (si) si.addEventListener('keydown', function (e) { if (e.key === 'Enter') _doSearch(); });
        if (btn) btn.addEventListener('click', _doSearch);
    }

    // ═══ ESC ════════════════════════════════════════════════════════════════
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var td = document.getElementById('meta-table-dialog');
        var lm = document.getElementById('logs-modal');
        if (td && td.style.display !== 'none') { _closeTableDialog(); return; }
        if (lm && lm.style.display !== 'none') { _closeLogModal(); }
    });

    // ═══ INIT ════════════════════════════════════════════════════════════════
    function init() { _bindLogModal(); _bindTableDialog(); _loadLogSummary(); }

    window.adminMetadata = { init: init };
    window._metaOpenTable = _openTableDialog;
    window._metaOpenDay = _openLogModal;
})();

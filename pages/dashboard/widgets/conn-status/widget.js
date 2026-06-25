(function () {
    'use strict';

    var _PREVIEW = (function () {
        var rows = [
            ['#22c55e', 100, 124],
            ['#22c55e', 80,  310],
            ['#ef4444', 55,  null],
            ['#f59e0b', 38,  890],
        ];
        return '<svg viewBox="0 0 160 72" fill="none">' +
            rows.map(function (r, i) {
                var y = 4 + i * 17;
                var dot = '<circle cx="6" cy="'+(y+5)+'" r="4" fill="'+r[0]+'"/>';
                var bar = '<rect x="18" y="'+y+'" width="'+r[1]+'" height="5" rx="2" fill="var(--ink)" opacity="0.45"/>'+
                          '<rect x="18" y="'+(y+8)+'" width="'+(r[1]*0.6|0)+'" height="3" rx="1.5" fill="var(--ink-3)" opacity="0.3"/>';
                var lat = r[2]
                    ? '<rect x="'+(160-26)+'" y="'+y+'" width="24" height="5" rx="2" fill="'+r[0]+'" opacity="0.6"/>'
                    : '<rect x="'+(160-32)+'" y="'+y+'" width="30" height="5" rx="2" fill="#ef4444" opacity="0.55"/>';
                return dot + bar + lat;
            }).join('') + '</svg>';
    }());

    // state shared per widget instance via closure over element
    var _cache = {};   // keyed by widget instance (use a counter)
    var _instanceId = 0;

    function _latClass(ms) {
        if (ms === null || ms === undefined) return '';
        if (ms < 500)  return 'w-cs-latency--fast';
        if (ms < 1500) return 'w-cs-latency--slow';
        return 'w-cs-latency--bad';
    }

    function _latLabel(ms) {
        if (ms === null || ms === undefined) return '';
        if (ms >= 1000) return (ms / 1000).toFixed(1) + ' s';
        return ms + ' ms';
    }

    function _buildRows(conns, results) {
        var byId = {};
        (results || []).forEach(function (r) { byId[r.id] = r; });

        return conns.map(function (c) {
            var r   = byId[c.id];
            var pending = !r;
            var ok      = r && r.ok;
            var dot     = pending ? 'w-cs-dot--pending' : (ok ? 'w-cs-dot--ok' : 'w-cs-dot--error');
            var msg     = pending ? 'Comprobando...' : (ok ? r.message : (r.message || 'Error'));
            var lat     = (r && r.latency_ms != null) ? r.latency_ms : null;
            var latHtml = lat !== null
                ? '<span class="w-cs-latency '+_latClass(lat)+'">'+_latLabel(lat)+'</span>'
                : (pending ? '<span class="w-cs-latency">—</span>' : '');

            return '<div class="w-cs-row" data-conn-id="'+esc(c.id)+'">' +
                '<span class="w-cs-dot '+dot+'"></span>' +
                '<span class="w-cs-info">' +
                '<span class="w-cs-name">'+esc(c.name || c.type || c.id)+'</span>' +
                '<span class="w-cs-msg">'+esc(msg)+'</span>' +
                '</span>' +
                latHtml +
                '</div>';
        }).join('');
    }

    function _render(data, cfg, el) {
        var conns = cfg.scope === 'personal'
            ? data.connections.filter(function (c) { return c._personal_key || c.scope === 'personal'; })
            : data.connections;

        if (!conns.length) {
            el.innerHTML = '<div class="dash-empty">Sin conexiones</div>';
            return;
        }

        // Assign a stable instance key on the element
        if (!el._csId) { el._csId = ++_instanceId; }
        var key = el._csId;

        function _draw(results) {
            var rows = _buildRows(conns, results);
            var nOk  = (results || []).filter(function (r) { return r.ok; }).length;
            var total = conns.length;
            var summary = results
                ? nOk + ' / ' + total + ' OK'
                : 'Comprobando ' + total + ' conexiones...';

            el.innerHTML = '<div class="w-cs-list">' + rows + '</div>' +
                '<div class="w-cs-footer">' +
                '<span class="w-cs-summary">'+summary+'</span>' +
                '<button class="w-cs-refresh" data-cs-refresh>Actualizar</button>' +
                '</div>';

            el.querySelector('[data-cs-refresh]').addEventListener('click', function () {
                delete _cache[key];
                _draw(null);
                _fetchAndDraw();
            });
        }

        function _fetchAndDraw() {
            api.post('/api/connections/test-all', {})
                .then(function (res) {
                    var list = Array.isArray(res) ? res : [];
                    // filter to only the conns in scope
                    var ids = conns.map(function (c) { return c.id; });
                    _cache[key] = list.filter(function (r) { return ids.indexOf(r.id) !== -1; });
                    _draw(_cache[key]);
                })
                .catch(function () {
                    _draw([]);
                });
        }

        if (_cache[key]) {
            _draw(_cache[key]);
        } else {
            _draw(null);        // renders "pending" state immediately
            _fetchAndDraw();
        }
    }

    window._WIDGET_REGISTRY = window._WIDGET_REGISTRY || {};
    window._WIDGET_REGISTRY['conn-status'] = {
        title: 'Estado de conexiones',
        cols: 1,
        preview: _PREVIEW,
        defaultConfig: { scope: 'all' },
        render: _render,
    };
}());

// connections-state.js — estado, carga, render y test de conexiones
'use strict';

var _connections = [];
var _wsCtx = { personal: true, id: null, name: 'Personal' };
var _categoryFilter = 'llm';

function setWsCtx(ctx) { _wsCtx = ctx || { personal: true, id: null, name: 'Personal' }; }
function setCategoryFilter(cat) { _categoryFilter = cat || 'llm'; _applyFilter(); }

function getVisibleConnectionIds() {
    return _connections
        .filter(function (c) { return (Providers.category(c.type) === _categoryFilter); })
        .map(function (c) { return c.id; });
}

async function loadConnections(groupId) {
    var url = '/api/connections';
    if (groupId) url += '?group_id=' + encodeURIComponent(groupId);
    _connections = await api.get(url);
    _applyFilter();
}

function _applyFilter() {
    var f = FilterConnections.getFilter();
    var q = f.query.toLowerCase();
    var types = f.types;
    var labels = f.labels;
    // En modo grupo no filtramos por categoría — mostramos todas las conexiones del grupo
    var groupMode = !!window._connGroupMode;
    var filtered = _connections.filter(function (c) {
        var matchCat = groupMode || Providers.category(c.type) === _categoryFilter;
        var matchQ = !q || c.name.toLowerCase().indexOf(q) !== -1;
        var matchT = !types.length || types.indexOf(c.type) !== -1;
        var matchL = !labels.length || (function () {
            return labels.every(function (lk) {
                return (c.labels || []).indexOf(lk) !== -1;
            });
        }());
        return matchCat && matchQ && matchT && matchL;
    });
    renderGrouped(filtered, groupMode ? null : _categoryFilter);
}

function renderGrouped(conns, category) {
    var root = document.getElementById('connections-root');
    var list = conns !== undefined ? conns : _connections;
    if (!list.length) {
        var emptyMsg = conns && conns.length < _connections.length
            ? t('connections.empty_filtered')
            : t('connections.empty_none');
        root.innerHTML = '<div class="conn-empty">' + emptyMsg + '</div>';
        return;
    }

    // category === null → modo grupo: mostrar todos los tipos presentes
    var order = category ? Providers.order(category) : (function () {
        var seen = [], types = [];
        list.forEach(function (c) { if (c.type && seen.indexOf(c.type) === -1) { seen.push(c.type); types.push(c.type); } });
        return types;
    }());
    var groups = {};
    order.forEach(function (t) { groups[t] = []; });
    list.forEach(function (c) {
        var t = c.type || (order[0] || '');
        if (!groups[t]) groups[t] = [];
        groups[t].push(c);
    });

    var html = '';
    order.forEach(function (type) {
        var items = groups[type];
        if (!items || !items.length) return;
        var meta = Providers.meta(type);
        html += '<div class="conn-group" data-group="' + esc(type) + '">';
        html += '<div class="conn-group-header">';
        html += '<span class="conn-group-label conn-group-label--' + esc(meta.cls) + '">' + esc(meta.label) + '</span>';
        html += '<span class="conn-group-count">' + (items.length === 1 ? t('connections.count_one', { n: items.length }) : t('connections.count_many', { n: items.length })) + '</span>';
        html += '<button class="conn-group-test" data-group-test="' + esc(type) + '">';
        html += '<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 2.5l9 5.5-9 5.5V2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
        html += t('connections.test_group') + '</button></div>';
        html += '<div class="conn-group-grid">';
        items.forEach(function (c) { html += renderCard(c); });
        html += '</div></div>';
    });

    root.innerHTML = html;
}

function _fmtTokens(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
}

function _isCustomUrl(conn) {
    var urlField = Providers.fields(conn.type || '').find(function (f) { return f.key === 'url'; });
    var defaultUrl = urlField ? (urlField.default || '') : '';
    return !!(conn.url && conn.url !== defaultUrl);
}

function renderCard(c) {
    var sub = c.model || c.host || c.url || '';
    var totalTokens = (c.tokens_in || 0) + (c.tokens_out || 0);
    var tokenBadge = totalTokens
        ? '<span class="conn-token-badge" title="' + _fmtTokens(c.tokens_in || 0) + ' in / ' + _fmtTokens(c.tokens_out || 0) + ' out">' + _fmtTokens(totalTokens) + ' tok</span>'
        : '';
    var urlBadge = _isCustomUrl(c)
        ? '<span class="conn-url-badge" title="' + esc(c.url) + '">' + t('connections.card.custom_url') + '</span>'
        : '';

    // Badge de propiedad: solo en modo grupo
    var ownerBadge = '';
    if (window._connGroupMode) {
        if (c._shared) {
            var ownerLabel = c.owner_id ? '@' + c.owner_id : (t('teams.sharing.shared_badge') || 'Compartido');
            ownerBadge = '<span class="res-badge res-badge--shared">' + esc(ownerLabel) + '</span>';
        } else {
            ownerBadge = '<span class="res-badge res-badge--mine">' + (t('agents.card.badge_mine') || 'Tuyo') + '</span>';
        }
    }

    // Label chips: todos los grupos incluido privado
    var labelChips = (window.LABELS && c.labels && c.labels.length)
        ? LABELS.renderChips(c.labels, { hide: [] })
        : '';
    var labelsRow = labelChips
        ? '<div class="label-chips-row conn-label-chips">' + labelChips + '</div>'
        : '';

    var personalBadge = c._personal_key
        ? '<span class="conn-scope-badge">' + (t('connections.card.scope_personal') || 'Personal') + '</span>'
        : '';

    return '<article class="conn-card" data-conn-id="' + esc(c.id) + '">' +
        '<div class="conn-card-body">' +
        '<div class="conn-card-name-row">' +
        '<div class="conn-card-name">' + esc(c.name) + '</div>' +
        tokenBadge + ownerBadge + personalBadge +
        '</div>' +
        (sub ? '<div class="conn-card-sub">' + esc(sub) + (urlBadge ? ' ' + urlBadge : '') + '</div>' : (!urlBadge ? '' : '<div class="conn-card-sub">' + urlBadge + '</div>')) +
        labelsRow +
        '<div class="conn-card-status"></div>' +
        '</div>' +
        '<footer class="conn-card-footer">' +
        '<button class="cca-btn cca-btn--test" data-action="test" data-id="' + esc(c.id) + '" title="' + t('connections.actions.test') + '">' +
        '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 2.5l9 5.5-9 5.5V2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>' +
        '<button class="cca-btn" data-action="edit" data-id="' + esc(c.id) + '" title="' + t('connections.actions.edit') + '">' +
        '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button>' +
        (!c._shared ? '<button class="cca-btn" data-action="share" data-id="' + esc(c.id) + '" data-name="' + esc(c.name) + '" title="' + (t('teams.sharing.share_with') || 'Compartir con grupo') + '">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="3" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="13" r="1.5" stroke="currentColor" stroke-width="1.4"/><circle cx="4" cy="8" r="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 3.8L5.5 7.2M10.5 12.2L5.5 8.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>' +
            '</button>' : '') +
        (!c._shared ? '<button class="cca-btn cca-btn--delete" data-action="delete" data-id="' + esc(c.id) + '" title="' + t('connections.actions.delete') + '">' +
        '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' : '') +
        '</footer></article>';
}

function setStatus(id, state, msg, detail) {
    var card = document.querySelector('[data-conn-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    card.dataset.status = state;
    var el = card.querySelector('.conn-card-status');
    if (!el) return;
    if (state === 'testing') {
        el.removeAttribute('data-ok');
        el.textContent = t('connections.testing');
    } else if (state === 'ok') {
        el.dataset.ok = 'true';
        el.textContent = t('connections.test_ok') + (msg && msg !== 'OK' && !msg.startsWith('OK') ? ' — ' + msg : '');
    } else if (state === 'error') {
        el.dataset.ok = 'false';
        var text = t('connections.test_error');
        if (msg && msg !== 'Error') text += ': ' + msg;
        if (detail && detail !== msg) text += ' — ' + detail;
        el.textContent = text;
    } else {
        el.removeAttribute('data-ok');
        el.textContent = '';
    }
}

async function testConnections(ids) {
    ids.forEach(function (id) { setStatus(id, 'testing'); });
    try {
        var results = await api.post('/api/connections/test-all', { ids: ids });
        results.forEach(function (r) {
            setStatus(r.id, r.ok ? 'ok' : 'error', r.message || (r.ok ? 'OK' : 'Error'), r.detail);
        });
    } catch (e) {
        var errMsg = (e && (e.message || e.toString())) || 'Error desconocido';
        ids.forEach(function (id) { setStatus(id, 'error', errMsg); });
    }
}

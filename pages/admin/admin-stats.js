'use strict';

var _ICO_USERS = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 14c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
var _ICO_CONNS = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="4" r="2" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="13" r="2" stroke="currentColor" stroke-width="1.4"/><path d="M4 6v2a4 4 0 0 0 4 4m0 0V6m0 6a4 4 0 0 0 4-4V6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
var _ICO_AGENTS = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="3" y="6" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M6 6V4.5a2 2 0 0 1 4 0V6" stroke="currentColor" stroke-width="1.4"/><circle cx="6" cy="10" r="1" fill="currentColor"/><circle cx="10" cy="10" r="1" fill="currentColor"/><path d="M6.5 12.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
var _ICO_TOKENS = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M9.5 2L4 9h7l-4.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function fmtTokens(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
}

function renderStats(stats) {
    var grid = document.getElementById('stats-grid');
    var cards = [
        {
            label: 'Usuarios',
            value: stats.users_total,
            sub: stats.users_active + ' activos · ' + stats.users_verified + ' verificados',
            icon: _ICO_USERS,
        },
        {
            label: 'Conexiones',
            value: stats.connections_total,
            sub: fmtTokens(stats.tokens_in + stats.tokens_out) + ' tokens totales',
            icon: _ICO_CONNS,
        },
        {
            label: 'Agentes',
            value: stats.agents_public + stats.agents_private,
            sub: stats.agents_public + ' públicos · ' + stats.agents_private + ' privados',
            icon: _ICO_AGENTS,
        },
        {
            label: 'Tokens consumidos',
            value: fmtTokens(stats.tokens_in + stats.tokens_out),
            sub: fmtTokens(stats.tokens_in) + ' in · ' + fmtTokens(stats.tokens_out) + ' out',
            icon: _ICO_TOKENS,
        },
    ];

    grid.innerHTML = cards.map(function (c) {
        return '<div class="admin-stat-card">' +
            '<div class="stat-icon">' + c.icon + '</div>' +
            '<div class="stat-body">' +
            '<div class="stat-value">' + esc(String(c.value)) + '</div>' +
            '<div class="stat-label">' + esc(c.label) + '</div>' +
            '<div class="stat-sub">' + esc(c.sub) + '</div>' +
            '</div>' +
            '</div>';
    }).join('');
}

'use strict';

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
            icon: '👤',
            cls: '',
        },
        {
            label: 'Conexiones',
            value: stats.connections_total,
            sub: fmtTokens(stats.tokens_in + stats.tokens_out) + ' tokens totales',
            icon: '🔌',
            cls: '',
        },
        {
            label: 'Agentes',
            value: stats.agents_public + stats.agents_private,
            sub: stats.agents_public + ' públicos · ' + stats.agents_private + ' privados',
            icon: '🤖',
            cls: '',
        },
        {
            label: 'Tokens consumidos',
            value: fmtTokens(stats.tokens_in + stats.tokens_out),
            sub: fmtTokens(stats.tokens_in) + ' in · ' + fmtTokens(stats.tokens_out) + ' out',
            icon: '⚡',
            cls: '',
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

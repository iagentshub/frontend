// utils.js — utilidades generales
'use strict';

window.esc = function (s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

// Número de ítems por página; configurable en Preferencias del perfil.
window.getPageSize = function () {
    return Number(localStorage.getItem('ga-page-size')) || 24;
};

// Genera un SVG de barras diarias a partir de [{day: "YYYY-MM-DD", tokens: N}].
// n = número de días a mostrar (rellena con 0 los días sin datos).
window.tokenSparkline = function (data, n) {
    var today = new Date();
    var days = [];
    for (var i = n - 1; i >= 0; i--) {
        var d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    var map = {};
    (data || []).forEach(function (r) { map[r.day] = r.tokens || 0; });
    var values = days.map(function (d) { return map[d] || 0; });
    var max = Math.max.apply(null, values) || 1;
    var H = 32;
    var gap = n > 20 ? 0.4 : 0.6;
    var barW = (100 - (n - 1) * gap) / n;
    var bars = values.map(function (v, i) {
        var bh = v > 0 ? Math.max(v / max * H, 2) : 0;
        var x = i * (barW + gap);
        var y = H - bh;
        return '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) +
            '" width="' + barW.toFixed(2) + '" height="' + bh.toFixed(2) +
            '" rx="1" fill="var(--accent)" opacity="' + (bh > 0 ? '0.65' : '0') + '"/>';
    }).join('');
    return '<svg width="100%" height="32" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">' + bars + '</svg>';
};

// Inserta (o actualiza) un botón "Ver N más" justo después de `container`.
// Llama a `onMore` cuando se hace clic. Elimina el botón si no hay más ítems.
window.renderLoadMore = function (container, total, shown, onMore) {
    var existing = container.nextElementSibling;
    if (existing && existing.classList.contains('load-more-row')) existing.remove();
    if (total <= shown) return;
    var remaining = total - shown;
    var row = document.createElement('div');
    row.className = 'load-more-row';
    var btn = document.createElement('button');
    btn.className = 'btn btn-ghost btn-sm load-more-btn';
    btn.textContent = (window.t && t('common.load_more'))
        ? t('common.load_more').replace('{n}', remaining)
        : 'Ver ' + remaining + ' más';
    btn.addEventListener('click', onMore);
    row.appendChild(btn);
    container.insertAdjacentElement('afterend', row);
};

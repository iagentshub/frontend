(function () {
    'use strict';

    var _PREVIEW = (function(){
        var cards = [[0,0],[82,0],[0,44],[82,44]].map(function(p){
            return '<rect x="'+p[0]+'" y="'+p[1]+'" width="74" height="36" rx="5" fill="var(--surface-2)" stroke="var(--line)" stroke-width="1"/>'+
                   '<rect x="'+(p[0]+8)+'" y="'+(p[1]+8)+'" width="40" height="5" rx="2" fill="var(--ink)" opacity="0.5"/>'+
                   '<rect x="'+(p[0]+8)+'" y="'+(p[1]+18)+'" width="28" height="4" rx="2" fill="var(--ink-3)" opacity="0.35"/>';
        }).join('');
        return '<svg viewBox="0 0 160 84" fill="none">'+cards+'</svg>';
    }());

    function _render(data, cfg, el) {
        var count = parseInt(cfg.count, 10) || 4;
        var recent = (data.agents || []).slice(-count).reverse();
        if (!recent.length) {
            el.innerHTML = '<div class="dash-empty">Sin agentes</div>';
            return;
        }
        el.innerHTML = '<div class="w-recent-grid">' +
            recent.map(function(a){
                return '<a href="/agent/'+encodeURIComponent(a.id)+'" class="w-recent-card">'+
                    '<span class="w-recent-name">'+esc(a.name||'Agente')+'</span>'+
                    '<span class="w-recent-model">'+esc(a.model||'')+'</span>'+
                    '</a>';
            }).join('') + '</div>';
    }

    window._WIDGET_REGISTRY = window._WIDGET_REGISTRY || {};
    window._WIDGET_REGISTRY['recent'] = {
        title: 'Agentes recientes',
        cols: 2,
        preview: _PREVIEW,
        defaultConfig: { count: 4 },
        render: _render,
    };
}());

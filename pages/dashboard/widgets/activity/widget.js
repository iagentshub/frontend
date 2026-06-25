(function () {
    'use strict';

    var _PREVIEW = (function(){
        var vals=[20,48,32,72,52,88,58,100,42,68,82,46,92,62];
        var n=vals.length, w=160, h=56, bw=w/n-2;
        var bars = vals.map(function(v,i){
            var bh=Math.round((v/100)*(h-8)), x=i*(bw+2), y=h-bh;
            return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="2" fill="var(--accent)" opacity="0.8"/>';
        }).join('');
        return '<svg viewBox="0 0 '+w+' '+h+'" fill="none">'+bars+'</svg>';
    }());

    function _render(data, cfg, el) {
        var days  = parseInt(cfg.days, 10) || 14;
        var daily = (data.tokenDaily || []).slice(-days);
        if (!daily.length) {
            el.innerHTML = '<div class="dash-empty">Sin datos de actividad</div>';
            return;
        }
        var mx = Math.max.apply(null, daily.map(function(d){ return d.tokens||0; }));
        if (!mx) {
            el.innerHTML = '<div class="dash-empty">Sin actividad en '+days+' dias</div>';
            return;
        }
        var bars = '<div class="w-activity-histo">' +
            daily.map(function(d){
                var pct = Math.max(2, Math.round(((d.tokens||0)/mx)*100));
                return '<div class="w-activity-bar" style="height:'+pct+'%" title="'+(d.date||'')+': '+(d.tokens||0)+' tokens"></div>';
            }).join('') + '</div>';
        var label1 = daily[0] ? daily[0].date : '';
        var label2 = daily[daily.length-1] ? daily[daily.length-1].date : '';
        var foot = '<div class="w-activity-foot">'+
            '<span class="w-activity-foot-label">'+label1+'</span>'+
            '<span class="w-activity-foot-label">'+label2+'</span>'+
            '</div>';
        el.innerHTML = bars + foot;
    }

    window._WIDGET_REGISTRY = window._WIDGET_REGISTRY || {};
    window._WIDGET_REGISTRY['activity'] = {
        title: 'Actividad',
        cols: 1,
        preview: _PREVIEW,
        defaultConfig: { days: 14 },
        render: _render,
    };
}());

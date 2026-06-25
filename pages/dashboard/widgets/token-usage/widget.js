(function () {
    'use strict';

    var _PALETTE = ['#4f46e5','#0891b2','#059669','#d97706','#7c3aed','#db2777','#ef4444'];

    var _PREVIEW =
        '<svg viewBox="0 0 160 76" fill="none">' +
        '<rect x="0" y="0" width="32" height="8" rx="3" fill="var(--ink)" opacity="0.6"/>' +
        '<rect x="36" y="2" width="18" height="4" rx="2" fill="var(--ink-3)" opacity="0.38"/>' +
        '<polyline points="0,28 11,22 22,25 33,16 44,20 55,13 66,17 77,9 88,15 99,8 110,12 121,6 132,10 143,4 154,8" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>' +
        ['128','87','44'].map(function(fw,i){
            var y=38+i*13;
            return '<rect x="0" y="'+y+'" width="28" height="3" rx="1.5" fill="var(--ink-3)" opacity="0.35"/>'+
                   '<rect x="32" y="'+y+'" width="128" height="4" rx="2" fill="var(--surface-3)"/>'+
                   '<rect x="32" y="'+y+'" width="'+fw+'" height="4" rx="2" fill="var(--accent)"/>';
        }).join('') +
        '</svg>';

    function _fmt(n) {
        if (!n) return '0';
        if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
        if (n >= 1000)    return (n/1000).toFixed(1)+'k';
        return String(n);
    }

    function _polar(cx,cy,r,deg) {
        var rad = deg*Math.PI/180;
        return { x: cx+r*Math.cos(rad), y: cy+r*Math.sin(rad) };
    }

    function _sparkSVG(data) {
        var vals = data.map(function(d){ return d.tokens||0; });
        var mx   = Math.max.apply(null,vals);
        if (!mx) return '';
        var n = vals.length, w=300, h=36;
        var pts = vals.map(function(v,i){
            return ((n>1?i/(n-1):0.5)*w).toFixed(1)+','+(h-4-((v/mx)*(h-8))).toFixed(1);
        }).join(' ');
        return '<svg width="100%" height="36" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" fill="none">'+
               '<polyline points="'+pts+'" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    function _donutSVG(segs, total) {
        var cx=70,cy=70,rO=56,rI=36, a=-90, paths='';
        segs.forEach(function(s){
            var sw=(s.value/total)*360, end=a+Math.min(sw,359.99), lg=sw>180?1:0;
            var oS=_polar(cx,cy,rO,a), oE=_polar(cx,cy,rO,end);
            var iS=_polar(cx,cy,rI,a), iE=_polar(cx,cy,rI,end);
            paths+='<path d="M'+oS.x.toFixed(2)+' '+oS.y.toFixed(2)+
                   ' A'+rO+' '+rO+' 0 '+lg+' 1 '+oE.x.toFixed(2)+' '+oE.y.toFixed(2)+
                   ' L'+iE.x.toFixed(2)+' '+iE.y.toFixed(2)+
                   ' A'+rI+' '+rI+' 0 '+lg+' 0 '+iS.x.toFixed(2)+' '+iS.y.toFixed(2)+'Z"'+
                   ' fill="'+s.color+'" stroke="var(--surface)" stroke-width="2"/>';
            a+=sw;
        });
        return '<svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0">'+
               '<circle cx="'+cx+'" cy="'+cy+'" r="'+rO+'" fill="var(--surface-3)"/>'+
               paths+
               '<circle cx="'+cx+'" cy="'+cy+'" r="'+rI+'" fill="var(--surface)"/>'+
               '<text x="'+cx+'" y="'+(cy-5)+'" text-anchor="middle" font-size="13" font-weight="800" fill="var(--ink)">'+_fmt(total)+'</text>'+
               '<text x="'+cx+'" y="'+(cy+11)+'" text-anchor="middle" font-size="9" fill="var(--ink-3)">tokens</text>'+
               '</svg>';
    }

    function _byConnection(data, cfg) {
        var list = cfg.scope === 'personal'
            ? data.connections.filter(function(c){ return c._personal_key || c.scope === 'personal'; })
            : data.connections;
        return list
            .map(function(c){ return { name:c.name||c.type, total:(c.tokens_in||0)+(c.tokens_out||0) }; })
            .filter(function(c){ return c.total>0; })
            .sort(function(a,b){ return b.total-a.total; })
            .slice(0, cfg.limit||5);
    }

    function _byAgent(data, cfg) {
        // Build token index from connections
        var connTokens = {};
        var connScope  = {};
        data.connections.forEach(function(c){
            connTokens[c.id] = (c.tokens_in||0)+(c.tokens_out||0);
            connScope[c.id]  = c._personal_key || c.scope === 'personal';
        });
        var agents = data.agents;
        if (cfg.scope === 'personal') {
            agents = agents.filter(function(a){ return connScope[a.connection_id]; });
        }
        return agents
            .map(function(a){
                return { name: a.name||'Agente', sub: a.model||'', total: connTokens[a.connection_id]||0 };
            })
            .filter(function(a){ return a.total > 0; })
            .sort(function(a,b){ return b.total-a.total; })
            .slice(0, cfg.limit||5);
    }

    function _render(data, cfg, el) {
        var withUsage = (cfg.groupBy === 'agent') ? _byAgent(data, cfg) : _byConnection(data, cfg);
        var grand = withUsage.reduce(function(s,c){ return s+c.total; },0);

        var totalRow = '<div class="w-token-total-row">'+
            '<span class="w-token-total-value">'+_fmt(grand)+'</span>'+
            '<span class="w-token-total-label">tokens</span>'+
            '</div>';

        var spark = (data.tokenDaily && data.tokenDaily.length)
            ? '<div class="w-token-spark">'+_sparkSVG(data.tokenDaily)+'</div>' : '';

        if (!withUsage.length) {
            el.innerHTML = totalRow + spark + '<div class="dash-empty">Sin actividad de tokens</div>';
            return;
        }

        if ((cfg.vizType||'bars') === 'donut') {
            var segs = withUsage.map(function(c,i){ return { value:c.total, color:_PALETTE[i%_PALETTE.length], name:c.name }; });
            var legend = '<div class="w-donut-legend">' +
                segs.map(function(s){ return '<div class="w-donut-legend-item">'+
                    '<span class="w-donut-dot" style="background:'+s.color+'"></span>'+
                    '<span class="w-donut-legend-name">'+s.name+'</span>'+
                    '<span class="w-donut-legend-val">'+_fmt(s.value)+'</span>'+
                    '</div>'; }).join('') + '</div>';
            el.innerHTML = totalRow + '<div class="w-donut-wrap">'+_donutSVG(segs,grand)+legend+'</div>';
        } else {
            var mx = withUsage[0].total;
            el.innerHTML = totalRow + spark +
                '<div class="w-token-list">' + withUsage.map(function(c){
                    var pct = mx>0 ? Math.round((c.total/mx)*100) : 0;
                    var sub = c.sub ? '<span class="w-token-sub">'+esc(c.sub)+'</span>' : '';
                    return '<div class="w-token-row">'+
                        '<div class="w-token-row-head">'+
                        '<span class="w-token-name-wrap"><span class="w-token-name">'+esc(c.name)+'</span>'+sub+'</span>'+
                        '<span class="w-token-amount">'+_fmt(c.total)+'</span>'+
                        '</div>'+
                        '<div class="w-token-track"><div class="w-token-fill" style="width:'+pct+'%"></div></div>'+
                        '</div>';
                }).join('') + '</div>';
        }
    }

    window._WIDGET_REGISTRY = window._WIDGET_REGISTRY || {};
    window._WIDGET_REGISTRY['token-usage'] = {
        title: 'Uso de tokens',
        cols: 1,
        preview: _PREVIEW,
        defaultConfig: { vizType: 'bars', groupBy: 'connection', scope: 'all', limit: 5 },
        render: _render,
    };
}());

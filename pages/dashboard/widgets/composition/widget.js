(function () {
    'use strict';

    var _PROV_COLORS = {
        openai:    '#10a37f',
        anthropic: '#d97706',
        google:    '#4285f4',
        ollama:    '#7c3aed',
        iagentshub:'#ef4444',
    };

    var _PREVIEW = (function(){
        var rows = [['openai','#10a37f',100],['anthropic','#d97706',68],['google','#4285f4',42],['ollama','#7c3aed',26]];
        return '<svg viewBox="0 0 160 64" fill="none">' +
            rows.map(function(r,i){
                var y=i*16;
                return '<rect x="0" y="'+y+'" width="24" height="4" rx="2" fill="var(--ink-3)" opacity="0.3"/>'+
                       '<rect x="28" y="'+y+'" width="128" height="8" rx="2" fill="var(--surface-3)"/>'+
                       '<rect x="28" y="'+y+'" width="'+r[2]+'" height="8" rx="2" fill="'+r[1]+'"/>';
            }).join('') + '</svg>';
    }());

    function _render(data, cfg, el) {
        var counts = {};
        (data.connections || []).forEach(function(c){
            var p = (c.type||'other').toLowerCase();
            counts[p] = (counts[p]||0) + 1;
        });
        (data.agents || []).forEach(function(a){
            var p = (a.model||'other').toLowerCase().split(/[-/]/)[0];
            counts[p] = (counts[p]||0) + 1;
        });

        var entries = Object.keys(counts)
            .map(function(k){ return { name:k, count:counts[k] }; })
            .sort(function(a,b){ return b.count-a.count; })
            .slice(0,6);

        if (!entries.length) {
            el.innerHTML = '<div class="dash-empty">Sin datos</div>';
            return;
        }

        var mx = entries[0].count;
        el.innerHTML = '<div class="w-comp-list">' + entries.map(function(e){
            var pct = mx > 0 ? Math.round((e.count/mx)*100) : 0;
            var color = _PROV_COLORS[e.name] || 'var(--ink-3)';
            return '<div class="w-comp-row">'+
                '<div class="w-comp-row-head">'+
                '<span class="w-comp-type-name">'+esc(e.name)+'</span>'+
                '<span class="w-comp-type-pct">'+e.count+'</span>'+
                '</div>'+
                '<div class="w-comp-track"><div class="w-comp-fill" style="width:'+pct+'%;background:'+color+'"></div></div>'+
                '</div>';
        }).join('') + '</div>';
    }

    window._WIDGET_REGISTRY = window._WIDGET_REGISTRY || {};
    window._WIDGET_REGISTRY['composition'] = {
        title: 'Composicion',
        cols: 1,
        preview: _PREVIEW,
        defaultConfig: {},
        render: _render,
    };
}());

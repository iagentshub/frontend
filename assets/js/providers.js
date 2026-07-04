// providers.js — singleton que carga /api/connections/providers una vez
// y expone helpers para el resto de módulos de la página de conexiones.
'use strict';

var Providers = (function () {
    var _list = [];   // [{type, label, icon, fields}]
    var _map = {};    // type → {label, cls, icon, fields}
    var _loaded = false;

    return {
        /** Carga los providers desde la API. Llama una sola vez en init(). */
        load: async function () {
            if (_loaded) return;
            var data = await api.get('/api/connections/providers');
            _list = data || [];
            _map = {};
            _list.forEach(function (p) {
                _map[p.type] = {
                    label: p.label, cls: p.type, icon: p.icon,
                    category: p.category || 'llm', fields: p.fields || []
                };
            });
            _loaded = true;
        },

        /** Devuelve [{id, label}] para chips de filtro y opciones de select. */
        list: function (category) {
            var all = _list.map(function (p) { return { id: p.type, label: p.label }; });
            if (!category || category === 'all') return all;
            return _list
                .filter(function (p) { return (p.category || 'llm') === category; })
                .map(function (p) { return { id: p.type, label: p.label }; });
        },

        /** Devuelve el type_id del primer provider de la categoría dada. */
        first: function (category) {
            var filtered = category
                ? _list.filter(function (p) { return (p.category || 'llm') === category; })
                : _list;
            return filtered.length ? filtered[0].type : '';
        },

        /** Devuelve el orden de types (opcionalmente filtrado por categoría). */
        order: function (category) {
            if (!category || category === 'all') return _list.map(function (p) { return p.type; });
            return _list
                .filter(function (p) { return (p.category || 'llm') === category; })
                .map(function (p) { return p.type; });
        },

        /** Devuelve {label, cls, icon, category} para el tipo dado, o fallback. */
        meta: function (type) {
            return _map[type] || { label: type, cls: type, icon: '', category: 'llm', fields: [] };
        },

        /** Devuelve los fields del provider dado (o []). */
        fields: function (type) {
            return (_map[type] && _map[type].fields) || [];
        },

        /** Devuelve la categoría de un type_id dado. */
        category: function (type) {
            return (_map[type] && _map[type].category) || 'llm';
        },
    };
}());

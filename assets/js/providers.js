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
                _map[p.type] = { label: p.label, cls: p.type, icon: p.icon, fields: p.fields || [] };
            });
            _loaded = true;
        },

        /** Devuelve [{id, label}] para chips de filtro y opciones de select. */
        list: function () {
            return _list.map(function (p) { return { id: p.type, label: p.label }; });
        },

        /** Devuelve el type_id del primer provider registrado. */
        first: function () {
            return _list.length ? _list[0].type : '';
        },

        /** Devuelve el orden de types para renderGrouped. */
        order: function () {
            return _list.map(function (p) { return p.type; });
        },

        /** Devuelve {label, cls, icon} para el tipo dado, o fallback. */
        meta: function (type) {
            return _map[type] || { label: type, cls: type, icon: '', fields: [] };
        },

        /** Devuelve los fields del provider dado (o []). */
        fields: function (type) {
            return (_map[type] && _map[type].fields) || [];
        },
    };
}());

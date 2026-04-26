// api.js — helper para llamadas a la API REST
'use strict';

function _apiError(status, detail) {
    var e = new Error(detail || 'Error ' + status);
    e.status = status;
    return e;
}

window.api = {
    async get(url) {
        var r = await fetch((window.API_BASE || '') + url);
        if (r.status === 401) { window.location.replace('/login/'); throw _apiError(401); }
        if (!r.ok) { var d = await r.json().catch(function () { return {}; }); throw _apiError(r.status, d.detail); }
        return r.json();
    },
    async post(url, body) {
        var r = await fetch((window.API_BASE || '') + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (r.status === 401) { window.location.replace('/login/'); throw _apiError(401); }
        if (!r.ok) { var d = await r.json().catch(function () { return {}; }); throw _apiError(r.status, d.detail); }
        return r.json();
    },
    async del(url) {
        var r = await fetch((window.API_BASE || '') + url, { method: 'DELETE' });
        if (r.status === 401) { window.location.replace('/login/'); throw _apiError(401); }
        if (!r.ok) { var d = await r.json().catch(function () { return {}; }); throw _apiError(r.status, d.detail); }
        return r.json();
    },
};

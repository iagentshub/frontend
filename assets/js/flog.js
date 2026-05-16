'use strict';
(function (global) {
    function _ts() {
        var d = new Date();
        return d.getFullYear() + '-' +
            String(d.getMonth() + 1).padStart(2, '0') + '-' +
            String(d.getDate()).padStart(2, '0') + ' ' +
            String(d.getHours()).padStart(2, '0') + ':' +
            String(d.getMinutes()).padStart(2, '0') + ':' +
            String(d.getSeconds()).padStart(2, '0');
    }
    function _fmt(level, msg) {
        return _ts() + ' - ' + level.padEnd(7) + ' - ' + msg;
    }

    var _shipping = false;
    function _ship(level, msg) {
        if (_shipping) return;
        _shipping = true;
        try {
            fetch((window.API_BASE || '') + '/api/admin/logs/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level: level, message: msg }),
            }).catch(function () {});
        } catch (_) {}
        _shipping = false;
    }

    global.flog = {
        debug:   function (m) { console.debug(_fmt('DEBUG',   m)); },
        info:    function (m) { console.info (_fmt('INFO',    m)); _ship('INFO',    m); },
        ok:      function (m) { console.log  (_fmt('OK',      m)); _ship('OK',      m); },
        warning: function (m) { console.warn (_fmt('WARNING', m)); _ship('WARNING', m); },
        error:   function (m) { console.error(_fmt('ERROR',   m)); _ship('ERROR',   m); },
    };

    window.addEventListener('unhandledrejection', function (e) {
        global.flog.error('Unhandled promise rejection: ' + (e.reason || 'unknown'));
    });
    window.addEventListener('error', function (e) {
        global.flog.error('JS error: ' + e.message + ' (' + e.filename + ':' + e.lineno + ')');
    });
}(window));

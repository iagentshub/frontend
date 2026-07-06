'use strict';
(async function () {
    await window.requireAuth({ role: 'admin' });
    renderNav('nav-root', 'admin-logs');
    adminLogs.init();
}());

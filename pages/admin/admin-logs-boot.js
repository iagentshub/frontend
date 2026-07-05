'use strict';
(async function () {
    await window.requireAuth();
    renderNav('nav-root', 'admin-logs');
    adminLogs.init();
}());

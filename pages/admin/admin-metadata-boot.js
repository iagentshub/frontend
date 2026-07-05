'use strict';
(async function () {
    await window.requireAuth();
    renderNav('nav-root', 'admin-metadata');
    window.adminMetadata.init();
}());

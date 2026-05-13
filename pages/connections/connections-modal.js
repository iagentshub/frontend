// connections-modal.js — modal de crear/editar conexión
'use strict';

function openModal(conn) {
    var defaultType = conn && conn.type ? conn.type : Providers.first();
    document.getElementById('conn-modal-title').textContent = conn ? t('connections.modal.title_edit') : t('connections.modal.title_new');
    document.getElementById('conn-id').value = (conn && conn.id) ? conn.id : '';
    document.getElementById('conn-name').value = (conn && conn.name) ? conn.name : '';
    document.getElementById('conn-type').value = defaultType;
    document.getElementById('conn-api-key').value = (conn && conn.api_key) ? conn.api_key : '';
    document.getElementById('conn-host').value = (conn && conn.host) ? conn.host : '';
    document.getElementById('conn-model').value = (conn && conn.model) ? conn.model : '';
    // toggleTypeFields primero (pone la URL por defecto del proveedor),
    // luego sobreescribimos con la URL guardada si existe.
    toggleTypeFields(defaultType);
    if (conn && conn.url) {
        document.getElementById('conn-url').value = conn.url;
    }
    document.getElementById('conn-modal').style.display = 'flex';
    setTimeout(function () { document.getElementById('conn-name').focus(); }, 80);
}

function closeModal() {
    document.getElementById('conn-modal').style.display = 'none';
}

function toggleTypeFields(type) {
    var fields = Providers.fields(type);
    var hasHost = fields.some(function (f) { return f.key === 'host'; });
    var hasApiKey = fields.some(function (f) { return f.type === 'password'; });
    var hasUrl = fields.some(function (f) { return f.key === 'url'; });
    var urlField = fields.find(function (f) { return f.key === 'url'; });
    document.getElementById('field-api-key').style.display = hasApiKey ? '' : 'none';
    document.getElementById('field-host').style.display = hasHost ? '' : 'none';
    document.getElementById('field-url').style.display = hasUrl ? '' : 'none';
    // Siempre resetear la URL al defecto del proveedor cuando cambia el tipo.
    // openModal() sobreescribe esto con la URL guardada si existe.
    var urlInput = document.getElementById('conn-url');
    urlInput.value = (hasUrl && urlField) ? (urlField.default || '') : '';
    urlInput.placeholder = (hasUrl && urlField) ? (urlField.default || '') : '';
}

function buildProviderSelect() {
    var select = document.getElementById('conn-type');
    if (!select) return;
    select.innerHTML = Providers.list().map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(p.label) + '</option>';
    }).join('');
}

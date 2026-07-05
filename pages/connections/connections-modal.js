// connections-modal.js — modal de crear/editar conexión (form-builder dinámico)
'use strict';

// ── Form builder ──────────────────────────────────────────────────────────────

function buildDynamicFields(type, conn) {
    var container = document.getElementById('conn-dynamic-fields');
    if (!container) return;

    var fields = Providers.fields(type);
    var isEdit = !!(conn && conn.id);

    container.innerHTML = fields.map(function (f) {
        // checkbox: label lo renderiza el propio _buildInput, no necesita wrapper de label
        if (f.type === 'checkbox') {
            var savedVal = conn ? (conn[f.key] != null ? conn[f.key] : false) : false;
            return '<div class="field">' + _buildInput(f, savedVal) + '</div>';
        }

        var savedVal = conn ? (conn[f.key] != null ? String(conn[f.key]) : '') : '';
        var displayVal = f.type === 'password' ? '' : (savedVal || f.default || '');
        var hasOldPwd = f.type === 'password' && isEdit;

        var depends = '';
        if (f.depends_on) {
            depends = ' data-depends-on="' + esc(f.depends_on) +
                '" data-depends-value="' + esc(f.depends_value || '') + '"';
        }

        var hint = '';
        if (f.type === 'password' && hasOldPwd) {
            hint = '<span class="input-hint">' + t('connections.modal.api_key_hint') + '</span>';
        } else if (f.key === 'url' && f.default) {
            hint = '<span class="input-hint">' + t('connections.modal.hint_url') + '</span>';
        }

        return '<div class="field"' + depends + '>' +
            '<label>' + esc(f.label) + (f.required ? ' <span class="field-required">*</span>' : '') + '</label>' +
            _buildInput(f, displayVal) +
            hint +
            '</div>';
    }).join('');

    _bindDependsOn(container);
}

function _buildInput(f, val) {
    if (f.type === 'select') {
        var opts = (f.options || []).map(function (o) {
            return '<option value="' + esc(o.value) + '"' +
                (val === o.value ? ' selected' : '') + '>' + esc(o.label) + '</option>';
        }).join('');
        return '<select class="select" data-field-key="' + esc(f.key) + '">' + opts + '</select>';
    }

    if (f.type === 'textarea') {
        return '<textarea class="input" data-field-key="' + esc(f.key) + '"' +
            (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
            ' rows="4" style="font-family:monospace;font-size:0.78rem;resize:vertical">' +
            esc(val) + '</textarea>';
    }

    if (f.type === 'checkbox') {
        var checked = val === true || val === 'true' || val === '1';
        return '<label class="toggle">' +
            '<input type="checkbox" data-field-key="' + esc(f.key) + '"' + (checked ? ' checked' : '') + ' />' +
            '<span class="toggle-track"></span>' +
            '<span class="toggle-label">' + esc(f.label) + '</span>' +
            '</label>';
    }

    var inputType = f.type === 'password' ? 'password'
        : f.type === 'number' ? 'number'
            : 'text';

    return '<input class="input" type="' + inputType + '"' +
        ' data-field-key="' + esc(f.key) + '"' +
        (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : '') +
        (f.required ? ' required' : '') +
        ' value="' + esc(val) + '" />';
}

function _bindDependsOn(container) {
    container.querySelectorAll('[data-depends-on]').forEach(function (fieldDiv) {
        var key = fieldDiv.dataset.dependsOn;
        var expected = fieldDiv.dataset.dependsValue;
        var trigger = container.querySelector('[data-field-key="' + CSS.escape(key) + '"]');
        if (!trigger) { fieldDiv.style.display = 'none'; return; }
        function update() {
            var actual = trigger.type === 'checkbox' ? String(trigger.checked) : trigger.value;
            fieldDiv.style.display = actual === expected ? '' : 'none';
        }
        trigger.addEventListener('change', update);
        update();
    });
}

// ── Collect values from dynamic form ─────────────────────────────────────────

function collectDynamicFields() {
    var out = {};
    var container = document.getElementById('conn-dynamic-fields');
    if (!container) return out;
    container.querySelectorAll('[data-field-key]').forEach(function (el) {
        var key = el.dataset.fieldKey;
        var val = el.type === 'checkbox' ? el.checked : el.value.trim();
        if (val !== '' && val !== false && val != null) {
            out[key] = val;
        }
    });
    return out;
}

// ── Scope selector ─────────────────────────────────────────────────────────────

function _updateScopeHint(scope, wsName) {
    var hint = document.getElementById('conn-scope-hint');
    if (!hint) return;
    hint.textContent = scope === 'personal'
        ? (t('connections.modal.scope_hint_personal') || 'Solo visible para ti')
        : (t('connections.modal.scope_hint_workspace') || 'Compartible con los miembros de un grupo');
}

function getModalScope() {
    var el = document.getElementById('conn-scope');
    return el ? el.value : 'workspace';
}

// ── Open / close ──────────────────────────────────────────────────────────────

var _connLabels = ['private'];

function _initConnLabelsPicker(currentLabels) {
    // Las conexiones son siempre privadas → no mostrar selector de visibilidad
    _connLabels = currentLabels && currentLabels.length ? currentLabels.slice() : ['private'];
    if (_connLabels.indexOf('private') === -1) { _connLabels = ['private'].concat(_connLabels); }
    _connLabels = _connLabels.filter(function (l) { return l !== 'public'; });
    var wrap = document.getElementById('conn-labels-picker-wrap');
    if (!wrap || !window.LABELS) return;
    wrap.innerHTML = LABELS.renderPicker(_connLabels, 'conn-labels-picker', { excludeGroups: ['visibility', 'origin'] });
    LABELS.bindPicker('conn-labels-picker', _connLabels, function (newLabels) {
        _connLabels = newLabels;
    });
}

function getConnLabels() { return _connLabels.slice(); }

function openModal(conn, wsCtx, category) {
    var cat = category || (conn ? Providers.category(conn.type) : 'llm');
    buildProviderSelect(cat);
    var defaultType = conn && conn.type ? conn.type : Providers.first(cat);
    document.getElementById('conn-modal-title').textContent =
        conn ? t('connections.modal.title_edit') : t('connections.modal.title_new');
    document.getElementById('conn-id').value = conn && conn.id ? conn.id : '';
    document.getElementById('conn-name').value = conn && conn.name ? conn.name : '';
    document.getElementById('conn-type').value = defaultType;

    buildDynamicFields(defaultType, conn);
    _initConnLabelsPicker(conn ? (conn.labels || ['private']) : ['private']);

    // Scope row: only in team workspace
    var scopeRow = document.getElementById('conn-scope-row');
    var scopeEl = document.getElementById('conn-scope');
    var ctx = wsCtx || (typeof _wsCtx !== 'undefined' ? _wsCtx : null);
    if (scopeRow && scopeEl && ctx && !ctx.personal) {
        scopeRow.style.display = '';
        var initialScope = conn && conn._personal_key ? 'personal' : 'workspace';
        scopeEl.value = initialScope;
        _updateScopeHint(initialScope, ctx.name);
        scopeEl.onchange = function () { _updateScopeHint(scopeEl.value, ctx.name); };
    } else if (scopeRow) {
        scopeRow.style.display = 'none';
    }

    document.getElementById('conn-modal').style.display = 'flex';
    setTimeout(function () { document.getElementById('conn-name').focus(); }, 80);
}

function closeModal() {
    document.getElementById('conn-modal').style.display = 'none';
}

// ── Provider select ───────────────────────────────────────────────────────────

function buildProviderSelect(category) {
    var select = document.getElementById('conn-type');
    if (!select) return;
    select.innerHTML = Providers.list(category || 'all').map(function (p) {
        return '<option value="' + esc(p.id) + '">' + esc(p.label) + '</option>';
    }).join('');
}

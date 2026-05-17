'use strict';

var _knowSort = { col: 'created_at', dir: -1 };

function _populateKnowOwnerSelect() {
    var sel = document.getElementById('filter-know-owner');
    if (!sel) return;
    var current = sel.value;
    var owners = [];
    _allKnowledge.forEach(function (k) {
        var o = k.owner_email || k.owner_id;
        if (o && owners.indexOf(o) === -1) owners.push(o);
    });
    owners.sort();
    sel.innerHTML = '<option value="">Todos los propietarios</option>' +
        owners.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('');
    if (current) sel.value = current;
}

function applyKnowledgeFilters() {
    _populateKnowOwnerSelect();
    var q = ((document.getElementById('knowledge-search') || {}).value || '').toLowerCase();
    var type = (document.getElementById('filter-knowledge-type') || {}).value || '';
    var owner = ((document.getElementById('filter-know-owner') || {}).value || '');

    var filtered = _allKnowledge.filter(function (k) {
        if (q && !(k.title || '').toLowerCase().includes(q) &&
            !(k.owner_email || k.owner_id || '').toLowerCase().includes(q)) return false;
        if (type && k.type !== type) return false;
        if (owner) {
            var ko = k.owner_email || k.owner_id || '';
            if (ko !== owner) return false;
        }
        return true;
    });
    _sortAndRenderKnowledge(filtered);
}

function _sortAndRenderKnowledge(items) {
    var col = _knowSort.col;
    var dir = _knowSort.dir;
    var sorted = items.slice().sort(function (a, b) {
        if (col === 'char_count') {
            return ((a.char_count || 0) - (b.char_count || 0)) * dir;
        }
        var av = (a[col] || '').toString().toLowerCase();
        var bv = (b[col] || '').toString().toLowerCase();
        return av < bv ? -dir : av > bv ? dir : 0;
    });
    renderKnowledge(sorted);
}

function _thK(label, col) {
    var arrow = _knowSort.col === col ? (_knowSort.dir === 1 ? ' ▲' : ' ▼') : '';
    return '<th class="sortable" data-sort="' + col + '">' + label + arrow + '</th>';
}

function renderKnowledge(items) {
    var wrap = document.getElementById('knowledge-table-wrap');
    if (!wrap) return;
    if (!items || !items.length) {
        wrap.innerHTML = '<div class="admin-empty">No hay elementos de conocimiento.</div>';
        return;
    }

    var typeIcons = { url: '🌐', document: '📄' };

    var rows = items.map(function (k) {
        var icon = typeIcons[k.type] || '📎';
        var date = k.created_at
            ? new Date(k.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        var ownerDisplay = esc(k.owner_email || k.owner_id || '—');
        var typeBadge = k.type === 'url'
            ? '<span class="badge badge--ok">URL</span>'
            : '<span class="badge badge--type">Doc</span>';

        var actions =
            '<div class="admin-actions-menu">' +
            '<button class="btn-actions">⋮</button>' +
            '<div class="actions-dropdown" style="display:none">' +
            '<button class="action-item action-item--danger" data-action="delete" data-know-id="' + esc(k.id) + '">Eliminar</button>' +
            '</div>' +
            '</div>';

        return '<tr>' +
            '<td><span class="conn-name">' + icon + ' ' + esc(k.title || k.id) + '</span></td>' +
            '<td>' + typeBadge + '</td>' +
            '<td class="td-owner">' + ownerDisplay + '</td>' +
            '<td class="td-tokens">' + (k.char_count || 0).toLocaleString('es-ES') + '</td>' +
            '<td class="td-date">' + date + '</td>' +
            '<td class="td-actions">' + actions + '</td>' +
            '</tr>';
    }).join('');

    wrap.innerHTML =
        '<table class="admin-table">' +
        '<thead><tr>' +
        _thK('Título', 'title') +
        '<th>Tipo</th>' +
        _thK('Propietario', 'owner_email') +
        _thK('Chars', 'char_count') +
        _thK('Creado', 'created_at') +
        '<th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';

    wrap.querySelector('thead').addEventListener('click', function (e) {
        var th = e.target.closest('.sortable');
        if (!th) return;
        var col = th.dataset.sort;
        _knowSort.dir = _knowSort.col === col ? _knowSort.dir * -1 : 1;
        _knowSort.col = col;
        applyKnowledgeFilters();
    });

    wrap.addEventListener('click', function (e) {
        var allDropdowns = wrap.querySelectorAll('.actions-dropdown');
        var btn = e.target.closest('.btn-actions');
        if (btn) {
            var menu = btn.nextElementSibling;
            var isOpen = menu.style.display !== 'none';
            allDropdowns.forEach(function (d) { d.style.display = 'none'; });
            if (!isOpen) menu.style.display = '';
            e.stopPropagation();
            return;
        }
        if (!e.target.closest('.admin-actions-menu')) {
            allDropdowns.forEach(function (d) { d.style.display = 'none'; });
        }
        var item = e.target.closest('.action-item');
        if (!item) return;
        allDropdowns.forEach(function (d) { d.style.display = 'none'; });
        if (item.dataset.action === 'delete') {
            _handleKnowledgeDelete(item.dataset.knowId);
        }
    });
}

async function _handleKnowledgeDelete(itemId) {
    if (!confirm('¿Eliminar este elemento de conocimiento permanentemente?')) return;
    try {
        await api.del('/api/admin/knowledge/' + encodeURIComponent(itemId));
        if (typeof toast === 'function') toast('Elemento eliminado', 'success');
        await reloadData();
    } catch (err) {
        if (typeof toast === 'function') toast(err.message || 'Error al eliminar el elemento', 'error');
    }
}

'use strict';

var _allWorkspaces = [];
var _wsSort = { col: 'created_at', dir: -1 };

function _thW(label, col) {
    var arrow = _wsSort.col === col ? (_wsSort.dir === 1 ? ' ▲' : ' ▼') : '';
    return '<th class="sortable" data-sort="' + col + '">' + label + arrow + '</th>';
}

function _fmtTokensWs(n) {
    if (!n) return '<span style="opacity:.4">—</span>';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function renderWorkspaces(workspaces) {
    var wrap = document.getElementById('workspaces-table-wrap');
    if (!workspaces.length) {
        wrap.innerHTML = '<div class="admin-empty">No hay grupos de trabajo.</div>';
        return;
    }

    var rows = workspaces.map(function (ws) {
        var date = ws.created_at
            ? new Date(ws.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        var tokens = (ws.tokens_in || 0) + (ws.tokens_out || 0);
        var isDisabled = ws.status === 'disabled';
        var statusBadge = isDisabled
            ? '<span class="badge badge--danger">Desactivado</span>'
            : '<span class="badge badge--ok">Activo</span>';
        return '<tr>' +
            '<td><strong>' + esc(ws.name) + '</strong></td>' +
            '<td>' + statusBadge + '</td>' +
            '<td>' + esc(ws.created_by || '—') + '</td>' +
            '<td class="td-tokens">' + (ws.member_count || 0) + '</td>' +
            '<td class="td-tokens">' + (ws.connections_count || 0) + '</td>' +
            '<td class="td-tokens">' + (ws.agents_count || 0) + '</td>' +
            '<td class="td-tokens">' + (ws.knowledge_count || 0) + '</td>' +
            '<td class="td-tokens">' + _fmtTokensWs(tokens) + '</td>' +
            '<td class="td-date">' + date + '</td>' +
            '<td class="td-actions">' +
            '<button class="btn btn-ghost btn-sm ws-toggle-btn" ' +
            'data-ws-id="' + esc(ws.id) + '" data-ws-name="' + esc(ws.name) + '" data-ws-status="' + esc(ws.status || 'active') + '">' +
            (isDisabled ? 'Reactivar' : 'Desactivar') + '</button> ' +
            '<button class="btn btn-ghost btn-sm ws-del-btn" ' +
            'data-ws-id="' + esc(ws.id) + '" data-ws-name="' + esc(ws.name) + '">Eliminar</button>' +
            '</td>' +
            '</tr>';
    }).join('');

    wrap.innerHTML =
        '<table class="admin-table">' +
        '<thead><tr>' +
        _thW('Nombre', 'name') +
        '<th>Estado</th>' +
        _thW('Creador', 'created_by') +
        '<th>Miembros</th>' +
        '<th>Conexiones</th>' +
        '<th>Agentes</th>' +
        '<th>Conocimiento</th>' +
        _thW('Tokens', 'tokens_in') +
        _thW('Creado', 'created_at') +
        '<th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';

    wrap.querySelector('thead').addEventListener('click', function (e) {
        var th = e.target.closest('.sortable');
        if (!th) return;
        var col = th.dataset.sort;
        _wsSort.dir = _wsSort.col === col ? _wsSort.dir * -1 : 1;
        _wsSort.col = col;
        applyWorkspaceFilters();
    });

    wrap.querySelectorAll('.ws-del-btn').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            var wsId = btn.dataset.wsId;
            var wsName = btn.dataset.wsName;
            if (!confirm('¿Eliminar el grupo "' + wsName + '"? Se borrará todo su contenido compartido — los recursos originales de sus dueños no se ven afectados. Esta acción no se puede deshacer.')) return;
            try {
                await api.del('/api/admin/workspaces/' + encodeURIComponent(wsId));
                toast('Grupo eliminado', 'success');
                _allWorkspaces = await api.get('/api/admin/workspaces');
                applyWorkspaceFilters();
            } catch (err) {
                toast(err.message || 'Error al eliminar', 'error');
            }
        });
    });

    wrap.querySelectorAll('.ws-toggle-btn').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            var wsId = btn.dataset.wsId;
            var wsName = btn.dataset.wsName;
            var isDisabled = btn.dataset.wsStatus === 'disabled';
            var newStatus = isDisabled ? 'active' : 'disabled';
            if (!isDisabled && !confirm('¿Desactivar el grupo "' + wsName + '"? Sus miembros no podrán acceder a los recursos compartidos hasta que se reactive.')) return;
            try {
                await api.post('/api/admin/workspaces/' + encodeURIComponent(wsId) + '/status', { status: newStatus });
                toast(isDisabled ? 'Grupo reactivado' : 'Grupo desactivado', 'success');
                _allWorkspaces = await api.get('/api/admin/workspaces');
                applyWorkspaceFilters();
            } catch (err) {
                toast(err.message || 'Error al cambiar el estado', 'error');
            }
        });
    });
}

function applyWorkspaceFilters() {
    var q = ((document.getElementById('ws-search') || {}).value || '').toLowerCase();
    var filtered = _allWorkspaces.filter(function (ws) {
        if (q && !ws.name.toLowerCase().includes(q) && !(ws.created_by || '').toLowerCase().includes(q)) return false;
        return true;
    });
    var col = _wsSort.col;
    var dir = _wsSort.dir;
    filtered = filtered.slice().sort(function (a, b) {
        var av = (String(a[col] || '')).toLowerCase();
        var bv = (String(b[col] || '')).toLowerCase();
        return av < bv ? -dir : av > bv ? dir : 0;
    });
    renderWorkspaces(filtered);
}

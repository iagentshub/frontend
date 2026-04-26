// agents.js — inicialización y acciones de la página de agentes
'use strict';

async function init() {
    await window.requireAuth();
    renderNav('nav-root', 'agents');
    await _loadAll();
    _bindActions();
    _bindAgentModal();
    _bindExportModal();
}

function _bindActions() {
    FilterAgents.init({
        mountEl: '#filter-agents-root',
        skills: _skills,
        connections: _connections,
        onChange: function () { _applyFilter(); },
    });

    document.getElementById('btn-new-agent').addEventListener('click', () => _openAgentModal());

    document.getElementById('agents-grid').addEventListener('click', async e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id } = btn.dataset;
        if (action === 'chat') {
            const a = _agents.find(x => x.id === id);
            if (a && typeof openChat === 'function') openChat(a);
        } else if (action === 'edit') {
            try {
                const full = await api.get(`/api/agents/${encodeURIComponent(id)}`);
                _openAgentModal(full);
            } catch (e) { toast(e.message, 'error'); }
        } else if (action === 'export') {
            _openExportModal(id);
        } else if (action === 'delete') {
            if (!confirm('Eliminar este agente?')) return;
            try {
                await api.del(`/api/agents/${encodeURIComponent(id)}`);
                toast('Agente eliminado', 'info');
                await _loadAll();
            } catch (e) { toast(e.message, 'error'); }
        }
    });
}

init();

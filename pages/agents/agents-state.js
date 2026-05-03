// agents-state.js — estado global y carga de datos
'use strict';

let _agents = [];
let _connections = [];
let _skills = [];
let _memories = [];

async function _loadAll() {
    [_agents, _connections, _skills, _memories] = await Promise.all([
        api.get('/api/agents'),
        api.get('/api/connections'),
        api.get('/api/skills'),
        api.get('/api/memory').catch(() => []),
    ]);
    FilterAgents.setData(_skills, _connections);
    _applyFilter();
    _syncConnectionSelect();
}

function _applyFilter() {
    const f = FilterAgents.getFilter();
    let list = _agents;

    if (f.query) {
        const q = f.query.toLowerCase();
        list = list.filter(a =>
            a.name.toLowerCase().includes(q) ||
            (a.description || '').toLowerCase().includes(q)
        );
    }
    if (f.skillIds.length) {
        list = list.filter(a =>
            f.skillIds.every(sid => (a.skills || []).includes(sid))
        );
    }
    if (f.connIds.length) {
        list = list.filter(a => f.connIds.includes(a.connection_id));
    }
    if (f.memory === true) list = list.filter(a => a.use_memory);
    if (f.memory === false) list = list.filter(a => !a.use_memory);
    if (f.scope) list = list.filter(a => (a.scope || 'private') === f.scope);

    AgentCard.renderGrid(list, _connections, _skills, document.getElementById('agents-grid'));
}

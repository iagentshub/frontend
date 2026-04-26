// agent-card.js — renderizado de cards de agente
'use strict';

var AgentCard = {
    _MAX_CHIPS: 3,
    _TYPE_LABELS: { openai: 'OpenAI', claude: 'Claude', gemini: 'Gemini', ollama: 'Ollama' },

    render: function (agent, connections, skills) {
        var conn = connections.find(function (c) { return c.id === agent.connection_id; });
        var typeKey = conn ? conn.type : null;
        var connLabel = typeKey ? (AgentCard._TYPE_LABELS[typeKey] || typeKey) : 'Sin IA';
        var pillCls = typeKey ? 'agent-conn-pill--' + esc(typeKey) : 'agent-conn-pill--default';

        // Skills: max 3 visible + "+N" overflow chip
        var agentSkills = agent.skills || [];
        var visibleSkills = agentSkills.slice(0, AgentCard._MAX_CHIPS);
        var overflow = agentSkills.length - AgentCard._MAX_CHIPS;
        var skillChips = visibleSkills.map(function (sid) {
            var sk = skills.find(function (s) { return s.id === sid; });
            return sk ? '<span class="agent-chip agent-chip--skill">' + esc(sk.name) + '</span>' : '';
        }).join('');
        if (overflow > 0) {
            skillChips += '<span class="agent-chip agent-chip--more">+' + overflow + '</span>';
        }

        var metaSep = skillChips ? '<span class="agent-meta-sep"></span>' : '';

        return '<div class="agent-card">' +
            '<div class="agent-card-body">' +
            '<div class="agent-card-name" title="' + esc(agent.name) + '">' + esc(agent.name) + '</div>' +
            '<div class="agent-card-desc">' + esc(agent.description || 'Sin descripcion') + '</div>' +
            '<div class="agent-card-meta">' +
            '<span class="agent-conn-pill ' + pillCls + '">' + esc(connLabel) + '</span>' +
            metaSep +
            skillChips +
            '</div>' +
            '</div>' +
            '<div class="agent-card-footer">' +
            '<button class="agent-action-chat" data-action="chat" data-id="' + esc(agent.id) + '">' +
            '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l2 2 2-2h5a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' +
            'Chat' +
            '</button>' +
            '<div class="agent-card-actions-right">' +
            '<button class="agent-action-icon" data-action="edit" data-id="' + esc(agent.id) + '" title="Editar">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' +
            '</button>' +
            '<button class="agent-action-icon" data-action="export" data-id="' + esc(agent.id) + '" title="Exportar">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 13h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
            '</button>' +
            '<button class="agent-action-icon agent-action-icon--danger" data-action="delete" data-id="' + esc(agent.id) + '" title="Eliminar">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '</div>';
    },

    renderGrid: function (agents, connections, skills, container) {
        if (!agents.length) {
            container.innerHTML =
                '<div class="empty-state">' +
                '<div class="empty-state-icon">&#129302;</div>' +
                '<p>No hay agentes todavia.<br>Crea el primero con <strong>+ Nuevo agente</strong>.</p>' +
                '</div>';
            return;
        }
        container.innerHTML = agents.map(function (a) {
            return AgentCard.render(a, connections, skills);
        }).join('');
    },
};

window.AgentCard = AgentCard;

// agents-export.js — modal de exportación de agentes
'use strict';

let _exportId = null;

function _openExportModal(agentId) {
    _exportId = agentId;
    document.getElementById('export-options').innerHTML = [
        { fmt: 'openai', icon: '&#129001;', label: t('agents.export.openai_label'), sub: t('agents.export.openai_sub') },
        { fmt: 'claude', icon: '&#128992;', label: t('agents.export.claude_label'), sub: t('agents.export.claude_sub') },
        { fmt: 'github', icon: '&#9899;', label: t('agents.export.github_label'), sub: t('agents.export.github_sub') },
    ].map(o => `
        <div class="export-opt" data-fmt="${o.fmt}">
            <span class="export-opt-icon">${o.icon}</span>
            <div>
                <div class="export-opt-label">${o.label}</div>
                <div class="export-opt-sub">${o.sub}</div>
            </div>
        </div>`).join('');

    document.querySelectorAll('.export-opt').forEach(el => {
        el.addEventListener('click', () => _doExport(_exportId, el.dataset.fmt));
    });
    document.getElementById('export-modal').style.display = 'flex';
}

async function _doExport(agentId, fmt) {
    try {
        const lang = (window.i18n && window.i18n.getLang && window.i18n.getLang()) || localStorage.getItem('ga-lang') || 'es';
        const r = await fetch(`${window.API_BASE || ''}/api/agents/${encodeURIComponent(agentId)}/export/${fmt}`, {
            headers: { 'Accept-Language': lang },
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || 'Error');
        const blob = await r.blob();
        const disp = r.headers.get('Content-Disposition') || '';
        const fn = (disp.match(/filename="([^"]+)"/) || [])[1] || `${agentId}-${fmt}.json`;
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), { href: url, download: fn }).click();
        URL.revokeObjectURL(url);
        toast(t('agents.export.exported', { name: fn }), 'success');
        document.getElementById('export-modal').style.display = 'none';
    } catch (e) { toast(e.message, 'error'); }
}

function _bindExportModal() {
    document.getElementById('export-modal-close').addEventListener('click', () => {
        document.getElementById('export-modal').style.display = 'none';
    });
    document.getElementById('export-modal').addEventListener('click', e => {
        if (e.target.id === 'export-modal') document.getElementById('export-modal').style.display = 'none';
    });
}

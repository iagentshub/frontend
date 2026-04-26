// agents-export.js — modal de exportación de agentes
'use strict';

let _exportId = null;

function _openExportModal(agentId) {
    _exportId = agentId;
    document.getElementById('export-options').innerHTML = [
        { fmt: 'openai', icon: '&#129001;', label: 'OpenAI Assistant', sub: 'JSON para Assistants API' },
        { fmt: 'claude', icon: '&#128992;', label: 'Anthropic Claude', sub: 'JSON para Claude API' },
        { fmt: 'github', icon: '&#9899;', label: 'GitHub Copilot', sub: '.github/copilot-instructions.md' },
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
        const r = await fetch(`${window.API_BASE || ''}/api/agents/${encodeURIComponent(agentId)}/export/${fmt}`);
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || 'Error');
        const blob = await r.blob();
        const disp = r.headers.get('Content-Disposition') || '';
        const fn = (disp.match(/filename="([^"]+)"/) || [])[1] || `${agentId}-${fmt}.json`;
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), { href: url, download: fn }).click();
        URL.revokeObjectURL(url);
        toast(`Exportado: ${fn}`, 'success');
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

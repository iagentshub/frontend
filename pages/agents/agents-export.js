// agents-export.js — modal de exportación de agentes
'use strict';

let _exportId = null;

// ── Install steps per format & OS ────────────────────────────────────────────
// Each step: { label, hint?, cmd? }
// {filepath} → full download path   {filename} → bare filename

const _STEPS = {
    claude: {
        mac: [
            {
                label: 'Open Terminal',
                hint:  'Press ⌘ Space, type "Terminal" and press Enter',
            },
            {
                label: 'Go to your project folder',
                hint:  'Tip: drag your project folder onto the Terminal window — it fills in the path automatically',
            },
            {
                label: 'Extract the downloaded file into the project',
                cmd:   'unzip {filepath}',
            },
            {
                label: 'Restart Claude Code to load the agent',
                cmd:   'claude',
            },
        ],
        linux: [
            {
                label: 'Open Terminal',
                hint:  'Press Ctrl+Alt+T or right-click the desktop → "Open Terminal"',
            },
            {
                label: 'Go to your project folder',
                hint:  'Replace the path below with the actual folder',
                cmd:   'cd ~/projects/your-project',
            },
            {
                label: 'Extract the downloaded file',
                cmd:   'unzip {filepath}',
            },
            {
                label: 'Restart Claude Code to load the agent',
                cmd:   'claude',
            },
        ],
        windows: [
            {
                label: 'Open PowerShell in your project folder',
                hint:  'In File Explorer, navigate to your project folder, then Shift+Right-click → "Open PowerShell window here"',
            },
            {
                label: 'Extract the downloaded file',
                cmd:   'Expand-Archive -Path "{filepath}" -DestinationPath . -Force',
            },
            {
                label: 'Restart Claude Code to load the agent',
                cmd:   'claude',
            },
        ],
    },

    github: {
        mac: [
            {
                label: 'Open Terminal in your repository folder',
                hint:  'In Finder, right-click your repository folder → "New Terminal at Folder"',
            },
            {
                label: 'Extract the downloaded file',
                cmd:   'unzip {filepath}',
            },
            {
                label: 'Commit the agent and skill files',
                cmd:   'git add .github && git commit -m "Add Copilot agent" && git push',
            },
        ],
        linux: [
            {
                label: 'Open Terminal',
                hint:  'Press Ctrl+Alt+T or right-click the desktop → "Open Terminal"',
            },
            {
                label: 'Go to your repository folder',
                cmd:   'cd ~/projects/your-repo',
            },
            {
                label: 'Extract the downloaded file',
                cmd:   'unzip {filepath}',
            },
            {
                label: 'Commit the agent and skill files',
                cmd:   'git add .github && git commit -m "Add Copilot agent" && git push',
            },
        ],
        windows: [
            {
                label: 'Open PowerShell in your repository folder',
                hint:  'In File Explorer, go to your repo folder, then Shift+Right-click → "Open PowerShell window here"',
            },
            {
                label: 'Extract the downloaded file',
                cmd:   'Expand-Archive -Path "{filepath}" -DestinationPath . -Force',
            },
            {
                label: 'Commit the agent and skill files',
                cmd:   'git add .github && git commit -m "Add Copilot agent" && git push',
            },
        ],
    },

    openai: {
        mac: [
            {
                label: 'Install the OpenAI Python SDK (only once)',
                cmd:   'pip3 install openai',
            },
            {
                label: 'Create the assistant with one command',
                hint:  'Make sure OPENAI_API_KEY is set in your environment first',
                cmd:   "python3 -c \"import json,openai; openai.beta.assistants.create(**json.load(open('{filepath}')))\"",
            },
            {
                label: 'Or paste the fields manually at platform.openai.com/assistants',
                hint:  'Open the JSON file in TextEdit to see the values to copy',
                cmd:   'open {filepath}',
            },
        ],
        linux: [
            {
                label: 'Install the OpenAI Python SDK (only once)',
                cmd:   'pip3 install openai',
            },
            {
                label: 'Create the assistant with one command',
                hint:  'Make sure OPENAI_API_KEY is set in your environment first',
                cmd:   "python3 -c \"import json,openai; openai.beta.assistants.create(**json.load(open('{filepath}')))\"",
            },
            {
                label: 'Or paste the fields manually at platform.openai.com/assistants',
                hint:  'Open the JSON file in any text editor to copy the values',
            },
        ],
        windows: [
            {
                label: 'Install the OpenAI Python SDK (only once)',
                cmd:   'pip install openai',
            },
            {
                label: 'Create the assistant with one command',
                hint:  'Make sure OPENAI_API_KEY is set in your environment first',
                cmd:   'python -c "import json,openai; openai.beta.assistants.create(**json.load(open(\'{filepath}\')))"',
            },
            {
                label: 'Or paste the fields manually at platform.openai.com/assistants',
                hint:  'Open the JSON file in Notepad to copy the values',
                cmd:   'notepad "{filepath}"',
            },
        ],
    },

    mcp: {
        mac: [
            {
                label: 'Install the MCP SDK (only once)',
                cmd:   'pip3 install mcp',
            },
            {
                label: 'Open the generated file and add your tool logic',
                hint:  'Each function marked "raise NotImplementedError" needs a real implementation — this is where the actual work happens',
                cmd:   'open {filepath}',
            },
            {
                label: 'Test that the server starts',
                cmd:   'python3 {filepath}',
            },
            {
                label: 'Register the server in Claude Desktop',
                hint:  'Add an entry under "mcpServers" in the config file',
                cmd:   'open ~/Library/Application\\ Support/Claude/claude_desktop_config.json',
            },
        ],
        linux: [
            {
                label: 'Install the MCP SDK (only once)',
                cmd:   'pip3 install mcp',
            },
            {
                label: 'Open the generated file and add your tool logic',
                hint:  'Each function marked "raise NotImplementedError" needs a real implementation',
                cmd:   'nano {filepath}',
            },
            {
                label: 'Test that the server starts',
                cmd:   'python3 {filepath}',
            },
            {
                label: 'Register the server in Claude Desktop',
                hint:  'Edit ~/.config/Claude/claude_desktop_config.json and add an entry under "mcpServers"',
            },
        ],
        windows: [
            {
                label: 'Install the MCP SDK (only once)',
                cmd:   'pip install mcp',
            },
            {
                label: 'Open the generated file and add your tool logic',
                hint:  'Each function marked "raise NotImplementedError" needs a real implementation',
                cmd:   'notepad "{filepath}"',
            },
            {
                label: 'Test that the server starts',
                cmd:   'python "{filepath}"',
            },
            {
                label: 'Register the server in Claude Desktop',
                hint:  'Edit %APPDATA%\\Claude\\claude_desktop_config.json and add an entry under "mcpServers"',
            },
        ],
    },
};

const _OS_LABELS = { mac: 'Mac', linux: 'Linux', windows: 'Windows' };

function _detectOS() {
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('win')) return 'windows';
    if (ua.includes('linux')) return 'linux';
    return 'mac';
}

function _filepath(os, filename) {
    if (os === 'windows') return `%USERPROFILE%\\Downloads\\${filename}`;
    return `~/Downloads/${filename}`;
}

// ── Format list ───────────────────────────────────────────────────────────────

function _openExportModal(agentId) {
    _exportId = agentId;
    _renderFormatList();
    document.getElementById('export-modal').style.display = 'flex';
}

function _renderFormatList() {
    const box = document.querySelector('#export-modal .modal-box');
    box.querySelector('.modal-title').textContent = t('agents.export.title');
    box.querySelector('.modal-body').innerHTML = `
        <p style="font-size:13px;color:var(--ink-2);margin-bottom:4px">${t('agents.export.choose_format')}</p>
        <div id="export-options" class="export-options"></div>`;

    const formats = [
        { fmt: 'openai', icon: '&#129001;', label: t('agents.export.openai_label'), sub: t('agents.export.openai_sub'), path: t('agents.export.openai_path') },
        { fmt: 'claude', icon: '&#128992;', label: t('agents.export.claude_label'), sub: t('agents.export.claude_sub'), path: t('agents.export.claude_path') },
        { fmt: 'github', icon: '&#9899;',   label: t('agents.export.github_label'), sub: t('agents.export.github_sub'), path: t('agents.export.github_path') },
        { fmt: 'mcp',    icon: '&#128268;', label: t('agents.export.mcp_label'),    sub: t('agents.export.mcp_sub'),    path: t('agents.export.mcp_path') },
    ];
    document.getElementById('export-options').innerHTML = formats.map(o => `
        <div class="export-opt" data-fmt="${o.fmt}">
            <span class="export-opt-icon">${o.icon}</span>
            <div>
                <div class="export-opt-label">${o.label}</div>
                <div class="export-opt-sub">${o.sub}</div>
                <div class="export-opt-path">${o.path}</div>
            </div>
        </div>`).join('');

    document.querySelectorAll('.export-opt').forEach(el => {
        el.addEventListener('click', () => _doExport(_exportId, el.dataset.fmt));
    });
}

// ── Download + show install panel ────────────────────────────────────────────

async function _doExport(agentId, fmt) {
    try {
        const lang = (window.i18n && window.i18n.getLang && window.i18n.getLang()) || localStorage.getItem('ga-lang') || 'es';
        const r = await fetch(`${window.API_BASE || ''}/api/agents/${encodeURIComponent(agentId)}/export/${fmt}`, {
            headers: { 'Accept-Language': lang },
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || 'Error');
        const blob = await r.blob();
        const disp = r.headers.get('Content-Disposition') || '';
        const filename = (disp.match(/filename="([^"]+)"/) || [])[1] || `${agentId}-${fmt}`;
        const url = URL.createObjectURL(blob);
        Object.assign(document.createElement('a'), { href: url, download: filename }).click();
        URL.revokeObjectURL(url);
        _renderInstallPanel(fmt, filename);
    } catch (e) { toast(e.message, 'error'); }
}

function _renderInstallPanel(fmt, filename) {
    let os = _detectOS();
    const box = document.querySelector('#export-modal .modal-box');

    box.querySelector('.modal-title').textContent = t('agents.export.install_title');

    box.querySelector('.modal-body').innerHTML = `
        <p class="export-install-status">&#10003; ${t('agents.export.downloaded')} <span class="install-filename">${_esc(filename)}</span></p>
        <div class="export-os-pills">
            ${Object.entries(_OS_LABELS).map(([k, v]) =>
                `<button class="skill-chip export-os-pill${k === os ? ' selected' : ''}" data-os="${k}">${v}</button>`
            ).join('')}
        </div>
        <div class="install-path-row">
            <label class="install-path-label">${t('agents.export.file_location')}</label>
            <input id="install-path-input" class="input install-path-input"
                   type="text" value="${_esc(_filepath(os, filename))}"
                   spellcheck="false" autocomplete="off">
        </div>
        <ol id="export-install-steps" class="export-install-steps"></ol>
        <div style="text-align:right;margin-top:16px">
            <button class="btn btn-ghost btn-sm" id="export-install-back" style="margin-right:8px">&#8592; ${t('agents.export.back')}</button>
            <button class="btn btn-primary btn-sm" id="export-install-done">${t('agents.export.done')}</button>
        </div>`;

    const getPath = () => document.getElementById('install-path-input').value || _filepath(os, filename);

    _renderSteps(fmt, filename, os, getPath());

    box.querySelectorAll('.export-os-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            box.querySelectorAll('.export-os-pill').forEach(p => p.classList.remove('selected'));
            pill.classList.add('selected');
            os = pill.dataset.os;
            document.getElementById('install-path-input').value = _filepath(os, filename);
            _renderSteps(fmt, filename, os, getPath());
        });
    });

    document.getElementById('install-path-input').addEventListener('input', () => {
        _renderSteps(fmt, filename, os, getPath());
    });

    box.querySelector('#export-install-back').addEventListener('click', _renderFormatList);
    box.querySelector('#export-install-done').addEventListener('click', () => {
        document.getElementById('export-modal').style.display = 'none';
    });
}

function _renderSteps(fmt, filename, os, fp) {
    if (fp === undefined) fp = _filepath(os, filename);
    const steps = (_STEPS[fmt] || {})[os] || [];
    document.getElementById('export-install-steps').innerHTML = steps.map(s => {
        const cmd = s.cmd ? s.cmd.replace(/\{filepath\}/g, fp).replace(/\{filename\}/g, filename) : null;
        return `<li class="export-install-step">
            <span class="install-step-label">${_esc(s.label)}</span>
            ${s.hint ? `<span class="install-hint">${_esc(s.hint)}</span>` : ''}
            ${cmd ? `<code class="install-cmd">${_esc(cmd)}</code>` : ''}
        </li>`;
    }).join('');
}

function _esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Modal close binding ───────────────────────────────────────────────────────

function _bindExportModal() {
    document.getElementById('export-modal-close').addEventListener('click', () => {
        document.getElementById('export-modal').style.display = 'none';
    });
}

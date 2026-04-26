// agents-skill-picker.js — selector de skills con categorías
'use strict';

var _SKILL_CATEGORIES = [
    { id: '__all__', label: 'Todas', icon: '◈' },
    { id: 'ai', label: 'IA', icon: '🤖' },
    { id: 'messaging', label: 'Mensajería', icon: '🗣️' },
    { id: 'notes', label: 'Notas', icon: '📝' },
    { id: 'productivity', label: 'Productividad', icon: '✅' },
    { id: 'dev', label: 'Desarrollo', icon: '💻' },
    { id: 'security', label: 'Seguridad', icon: '🔒' },
    { id: 'media', label: 'Media', icon: '🎬' },
    { id: 'data', label: 'Datos', icon: '🌐' },
    { id: 'company', label: 'Empresa', icon: '🏢' },
    { id: '__none__', label: 'Otras', icon: '📦' },
];

var _selectedSkillIds = [];
var _activeCat = '__all__';

function _initSkillPicker(selected) {
    _selectedSkillIds = [...selected];
    _activeCat = '__all__';
    _renderSkillChips();
    _renderCatTabs();
    _renderSkillGrid();
}

function _renderSkillChips() {
    const cont = document.getElementById('skill-selected-chips');
    if (!cont) return;
    if (!_selectedSkillIds.length) { cont.innerHTML = ''; return; }
    cont.innerHTML = _selectedSkillIds.map(sid => {
        const sk = _skills.find(s => s.id === sid);
        const label = sk ? (sk.icon ? sk.icon + ' ' : '') + sk.name : sid;
        return `<span class="skill-chip-selected">${esc(label)}<button type="button" class="skill-chip-remove" data-skill-id="${esc(sid)}">&times;</button></span>`;
    }).join('');
    cont.querySelectorAll('.skill-chip-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            _selectedSkillIds = _selectedSkillIds.filter(id => id !== btn.dataset.skillId);
            _renderSkillChips();
            _renderSkillGrid();
        });
    });
}

function _renderCatTabs() {
    const tabs = document.getElementById('skill-cat-tabs');
    if (!tabs) return;

    const visible = _SKILL_CATEGORIES.filter(cat => {
        if (cat.id === '__all__') return true;
        if (cat.id === '__none__') return _skills.some(s => !s.category);
        return _skills.some(s => s.category === cat.id);
    });

    tabs.innerHTML = visible.map(cat => {
        const active = _activeCat === cat.id ? ' active' : '';
        const count = cat.id === '__all__'
            ? _skills.length
            : cat.id === '__none__'
                ? _skills.filter(s => !s.category).length
                : _skills.filter(s => s.category === cat.id).length;
        return `<button type="button" class="skill-cat-tab${active}" data-cat="${esc(cat.id)}">
            <span class="sct-icon">${cat.icon}</span>
            <span class="sct-label">${esc(cat.label)}</span>
            <span class="sct-count">${count}</span>
        </button>`;
    }).join('');

    tabs.querySelectorAll('.skill-cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            _activeCat = btn.dataset.cat;
            tabs.querySelectorAll('.skill-cat-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _renderSkillGrid();
        });
    });
}

function _renderSkillGrid() {
    const container = document.getElementById('skill-modules');
    if (!container) return;

    const filtered = _skills.filter(sk => {
        if (_activeCat === '__all__') return true;
        if (_activeCat === '__none__') return !sk.category;
        return sk.category === _activeCat;
    });

    if (!filtered.length) {
        container.innerHTML = '<div class="skill-grid-empty">Sin skills en esta categoría</div>';
        return;
    }

    container.innerHTML = filtered.map(sk => {
        const sel = _selectedSkillIds.includes(sk.id);
        return `<button type="button" class="skill-grid-chip${sel ? ' selected' : ''}" data-skill-id="${esc(sk.id)}">
            ${sk.icon ? `<span class="sgc-icon">${esc(sk.icon)}</span>` : ''}
            <span class="sgc-name">${esc(sk.name)}</span>
            ${sel ? '<span class="sgc-check">✓</span>' : ''}
        </button>`;
    }).join('');

    container.querySelectorAll('.skill-grid-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.skillId;
            if (_selectedSkillIds.includes(id)) {
                _selectedSkillIds = _selectedSkillIds.filter(x => x !== id);
            } else {
                _selectedSkillIds.push(id);
            }
            _renderSkillChips();
            _renderSkillGrid();
        });
    });
}

function _getSelectedSkills() {
    return [..._selectedSkillIds];
}

// knowledge.js — página /knowledge (tabs: Skills · URLs · Documentos)
'use strict';

var _privateSkills = [];
var _activeTab = 'skills';

var _folderSkills = null;
var _folderUrls = null;
var _folderDocs = null;

var _viewMode = localStorage.getItem('kv-view') || 'grid';

async function init() {
    await window.requireAuth();
    renderNav('nav-root', 'knowledge');
    _initCatalog();
    _initFolders();
    _bindTabs();
    _initViewToggle();
    await loadSkills();
    bindEvents();
    KnowledgeUrls.init();
    KnowledgeDocs.init();
    _setupDragHandlers();
}

function _setupDragHandlers() {
    ['skills-grid', 'urls-grid', 'docs-grid'].forEach(function (gridId) {
        var grid = document.getElementById(gridId);
        if (!grid) return;
        grid.addEventListener('dragstart', function (e) {
            var card = e.target.closest('[data-drag-id]');
            if (!card) return;
            window._kDrag = { id: card.dataset.dragId, section: card.dataset.dragSection };
            card.classList.add('kd-dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        grid.addEventListener('dragend', function (e) {
            var card = e.target.closest('[data-drag-id]');
            if (card) card.classList.remove('kd-dragging');
            window._kDrag = null;
        });
    });
}

function _initCatalog() {
    SkillCatalog.init({
        mountEl: '#btn-skill-catalog',
        onImport: function (skill) {
            var folderId = _folderSkills ? _folderSkills.getActive() : null;
            DialogSkill.open(
                { name: skill.name, description: skill.description, icon: skill.icon, category: skill.category, content: skill.content, folder_id: folderId || undefined },
                loadSkills
            );
        },
    });
}

function _initFolders() {
    _folderSkills = KnowledgeFolders('skill', function (folderId) {
        loadSkills(folderId);
    });
    _folderUrls = KnowledgeFolders('url', function (folderId) {
        KnowledgeUrls.load(folderId);
    });
    _folderDocs = KnowledgeFolders('document', function (folderId) {
        KnowledgeDocs.load(folderId);
    });

    _folderSkills.mount(document.getElementById('kf-panel-skill'));
    _folderUrls.mount(document.getElementById('kf-panel-url'));
    _folderDocs.mount(document.getElementById('kf-panel-document'));

    // Expose as globals so sub-modules (docs, urls) can call updateStats
    window._folderSkills = _folderSkills;
    window._folderUrls = _folderUrls;
    window._folderDocs = _folderDocs;

    _folderSkills.load();
    _folderUrls.load();
    _folderDocs.load();
}

function _bindTabs() {
    document.getElementById('knowledge-tabs').addEventListener('click', function (e) {
        var btn = e.target.closest('.ktab');
        if (!btn) return;
        _switchTab(btn.dataset.tab);
    });
}

function _switchTab(tab) {
    _activeTab = tab;
    document.querySelectorAll('.ktab').forEach(function (b) {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach(function (p) {
        p.style.display = 'none';
    });
    var panel = document.getElementById('tab-' + tab);
    if (panel) panel.style.display = '';

    document.getElementById('skills-actions').style.display = tab === 'skills' ? '' : 'none';
    document.getElementById('urls-actions').style.display = tab === 'urls' ? '' : 'none';
    document.getElementById('docs-actions').style.display = tab === 'documents' ? '' : 'none';

    if (tab === 'urls') KnowledgeUrls.load(_folderUrls ? _folderUrls.getActive() : null);
    if (tab === 'documents') KnowledgeDocs.load(_folderDocs ? _folderDocs.getActive() : null);
}

function _applyView() {
    var controls = document.getElementById('kv-view-controls');
    if (controls) {
        controls.querySelectorAll('.kv-toggle').forEach(function (btn) {
            btn.classList.toggle('kv-toggle--active', btn.dataset.view === _viewMode);
        });
    }
    var isList = _viewMode === 'list';
    var urlsGrid = document.getElementById('urls-grid');
    var docsGrid = document.getElementById('docs-grid');
    var skillsGrid = document.getElementById('skills-grid');
    if (urlsGrid) urlsGrid.classList.toggle('knowledge-grid--list', isList);
    if (docsGrid) docsGrid.classList.toggle('knowledge-grid--list', isList);
    if (skillsGrid) skillsGrid.classList.toggle('skills-grid--list', isList);
}

function _initViewToggle() {
    _applyView();
    var controls = document.getElementById('kv-view-controls');
    if (!controls) return;
    controls.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-view]');
        if (!btn || btn.dataset.view === _viewMode) return;
        _viewMode = btn.dataset.view;
        localStorage.setItem('kv-view', _viewMode);
        _applyView();
    });
}

async function loadSkills(folderId) {
    var results = await Promise.all([
        api.get('/api/skills?scope=private'),
        api.get('/api/skills?scope=public'),
    ]);
    _privateSkills = results[0];
    SkillCatalog.setSkills(results[1]);

    var skills = folderId
        ? _privateSkills.filter(function (s) { return s.folder_id === folderId; })
        : _privateSkills;
    SkillCard.renderAll(skills, document.getElementById('skills-grid'), { showMove: true });

    if (_folderSkills) _folderSkills.updateStats(_privateSkills);
}

async function viewSkill(scope, id) {
    try {
        var s = await api.get('/api/skills/' + scope + '/' + encodeURIComponent(id));
        document.getElementById('skill-view-title').textContent = (s.icon ? s.icon + ' ' : '') + s.name;
        document.getElementById('skill-view-content').textContent = s.content || t('skills.no_content');
        document.getElementById('skill-view-modal').style.display = 'flex';
    } catch (e) { toast(e.message, 'error'); }
}

function bindEvents() {
    document.getElementById('btn-new-skill').addEventListener('click', function () {
        var folderId = _folderSkills ? _folderSkills.getActive() : null;
        DialogSkill.open(folderId ? { folder_id: folderId } : null, loadSkills);
    });

    document.getElementById('btn-load-skill').addEventListener('click', function () {
        document.getElementById('skill-file-input').click();
    });
    document.getElementById('skill-file-input').addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        var reader = new FileReader();
        reader.onload = function (ev) {
            try {
                var skill = _parseAndLoadSkill(ev.target.result);
                DialogSkill.open(skill, loadSkills);
            } catch (err) {
                toast(t('skills.page.load_error', { msg: err.message }), 'error');
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('skill-view-close').addEventListener('click', function () {
        document.getElementById('skill-view-modal').style.display = 'none';
    });
    document.getElementById('skills-grid').addEventListener('click', async function (e) {
        var moveBtn = e.target.closest('[data-move-id]');
        if (moveBtn) { _openSkillMoveMenu(moveBtn); return; }
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.dataset.action;
        var id = btn.dataset.id;
        var scope = btn.dataset.scope;
        if (action === 'view-skill') {
            viewSkill(scope, id);
        } else if (action === 'edit-skill') {
            try {
                var s = await api.get('/api/skills/private/' + encodeURIComponent(id));
                DialogSkill.open(s, loadSkills);
            } catch (e) { toast(e.message, 'error'); }
        } else if (action === 'del-skill') {
            if (!confirm(t('skills.confirm_delete'))) return;
            try {
                await api.del('/api/skills/private/' + encodeURIComponent(id));
                toast(t('skills.deleted'), 'info');
                await loadSkills(_folderSkills ? _folderSkills.getActive() : null);
            } catch (e) { toast(e.message, 'error'); }
        } else if (action === 'share-skill') {
            if (window.shareTeams) shareTeams.open('skill', id, btn.dataset.name || id);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        document.getElementById('skill-view-modal').style.display = 'none';
    });
}

function _openSkillMoveMenu(btn) {
    var folders = _folderSkills ? _folderSkills.getFolders() : [];
    if (!folders.length) { toast('Crea primero una carpeta', 'info'); return; }
    var skillId = btn.dataset.moveId;
    var options = '<option value="">— Sin carpeta —</option>' +
        folders.map(function (f) { return '<option value="' + esc(f.id) + '">' + esc(f.name) + '</option>'; }).join('');
    var sel = document.createElement('select');
    sel.innerHTML = options;
    sel.style.cssText = 'position:fixed;z-index:300;background:var(--surface);border:1px solid var(--line-strong);border-radius:6px;padding:4px 8px;font-size:13px;font-family:var(--font);';
    var rect = btn.getBoundingClientRect();
    sel.style.top = (rect.bottom + 4) + 'px';
    sel.style.left = rect.left + 'px';
    document.body.appendChild(sel);
    sel.focus();
    sel.addEventListener('change', function () {
        var newFolder = sel.value || null;
        if (sel.parentNode) sel.remove();
        api.patch('/api/skills/private/' + encodeURIComponent(skillId) + '/folder', { folder_id: newFolder })
            .then(function () {
                var s = _privateSkills.find(function (sk) { return sk.id === skillId; });
                if (s) s.folder_id = newFolder;
                loadSkills(_folderSkills ? _folderSkills.getActive() : null);
            })
            .catch(function (e) { toast(e.message, 'error'); });
    });
    sel.addEventListener('blur', function () { if (sel.parentNode) sel.remove(); });
}

init();

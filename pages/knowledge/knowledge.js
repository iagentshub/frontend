// knowledge.js — página /knowledge (tabs: Skills · Webs · Documentos)
'use strict';

var _privateSkills = [];
var _activeTab = 'skills';

async function init() {
    await window.requireAuth();
    renderNav('nav-root', 'knowledge');
    _initCatalog();
    _bindTabs();
    await loadSkills();
    bindEvents();
    KnowledgeUrls.init();
    KnowledgeDocs.init();
}

function _initCatalog() {
    SkillCatalog.init({
        mountEl: '#btn-skill-catalog',
        onImport: function (skill) {
            DialogSkill.open(
                { name: skill.name, description: skill.description, icon: skill.icon, category: skill.category, content: skill.content },
                loadSkills
            );
        },
    });
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

    // Mostrar/ocultar acciones según tab
    document.getElementById('skills-actions').style.display = tab === 'skills' ? '' : 'none';
    document.getElementById('urls-actions').style.display = tab === 'urls' ? '' : 'none';
    document.getElementById('docs-actions').style.display = tab === 'documents' ? '' : 'none';

    if (tab === 'urls') KnowledgeUrls.load();
    if (tab === 'documents') KnowledgeDocs.load();
}

async function loadSkills() {
    var results = await Promise.all([
        api.get('/api/skills?scope=private'),
        api.get('/api/skills?scope=public'),
    ]);
    _privateSkills = results[0];
    SkillCatalog.setSkills(results[1]);
    SkillCard.renderAll(_privateSkills, document.getElementById('skills-grid'));
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
        DialogSkill.open(null, loadSkills);
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
                await loadSkills();
            } catch (e) { toast(e.message, 'error'); }
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        document.getElementById('skill-view-modal').style.display = 'none';
    });
}

init();

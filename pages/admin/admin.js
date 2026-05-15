'use strict';

var _activeTab = 'general';
var _lastRefresh = 0;
var _refreshTimer = null;
var _countTimer = null;
var _connections = [];
var _allAgents = [];
var _allKnowledge = [];

async function reloadData() {
    try {
        var results = await Promise.all([
            api.get('/api/admin/stats'),
            api.get('/api/admin/users'),
            api.get('/api/admin/agents'),
            api.get('/api/admin/connections'),
            api.get('/api/admin/knowledge'),
        ]);
        renderStats(results[0]);

        _allUsers = results[1];
        applyUserFilters();

        _allAgents = results[2];
        applyAgentFilters();

        _connections = results[3];
        applyConnFilters();

        _allKnowledge = results[4];
        applyKnowledgeFilters();

        _lastRefresh = Date.now();
        _updateRefreshLabel();
    } catch (e) {
        if (e && e.status === 403) {
            window.location.replace('/dashboard/');
        }
    }
}

function _updateRefreshLabel() {
    var label = document.getElementById('refresh-label');
    if (!label) return;
    if (!_lastRefresh) { label.textContent = ''; return; }
    var secs = Math.round((Date.now() - _lastRefresh) / 1000);
    label.textContent = 'Actualizado hace ' + secs + 's';
}

function _startPolling() {
    _countTimer = setInterval(_updateRefreshLabel, 1000);
    _refreshTimer = setInterval(reloadData, 30000);
}

var _TAB_IDS = ['general', 'users', 'agents', 'connections', 'knowledge'];

function _bindTabs() {
    document.querySelectorAll('.admin-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            _activeTab = btn.dataset.tab;
            document.querySelectorAll('.admin-tab').forEach(function (b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            _TAB_IDS.forEach(function (id) {
                var panel = document.getElementById('tab-' + id);
                if (panel) panel.style.display = (id === _activeTab) ? '' : 'none';
            });
        });
    });
}

function _bindFilters() {
    ['user-search', 'filter-role', 'filter-active', 'filter-verified'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('input', applyUserFilters);
    });
    ['agent-search'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('input', applyAgentFilters);
    });
    var agentOwnerSel = document.getElementById('filter-agent-owner');
    if (agentOwnerSel) agentOwnerSel.addEventListener('change', applyAgentFilters);
    ['knowledge-search', 'filter-knowledge-type', 'filter-know-owner'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('input', applyKnowledgeFilters);
    });
    var connOwnerSel = document.getElementById('filter-conn-owner');
    if (connOwnerSel) connOwnerSel.addEventListener('change', applyConnFilters);
    var btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) btnRefresh.addEventListener('click', reloadData);
}

async function init() {
    await window.requireAuth();
    renderNav('nav-root', 'admin-users');
    _bindTabs();
    _bindFilters();
    await reloadData();
    _startPolling();
}

init();

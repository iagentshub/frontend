// about.js — Página Acerca de (standalone, sin auth requerida)
'use strict';

var _STACK = [
    { key: 'python',     label: 'Python' },
    { key: 'fastapi',    label: 'FastAPI' },
    { key: 'sqlite',     label: 'SQLite' },
    { key: 'postgresql', label: 'PostgreSQL' },
    { key: 'nginx',      label: 'Nginx' },
    { key: 'docker',     label: 'Docker' },
    { key: 'vanillajs',  label: 'Vanilla JS' },
];

var _CREATORS = [
    { name: 'Andrés David Hernández Rocamora', github: 'https://github.com/andresdavidhr', username: 'andresdavidhr' },
    { name: 'Javier Miralles',                 github: 'https://github.com/Jariviii',      username: 'Jariviii' },
];

function init() {
    _checkAuthForHeader();
    _initLangBtn();

    if (window.i18n) {
        window.i18n.ready(function () { _render(); _syncLangBtn(); });
        window.i18n.onLangChange(function () { _render(); _syncLangBtn(); });
    } else {
        _render();
    }

}

function _checkAuthForHeader() {
    fetch('/api/auth/me')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
            var btn = document.getElementById('about-header-action');
            if (!btn || !d || !d.username) return;
            btn.href = '/dashboard';
            btn.removeAttribute('data-i18n');
            btn.textContent = '← Dashboard';
        })
        .catch(function () {});
}

function _initLangBtn() {
    var btn = document.getElementById('about-lang-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
        var curr = window.i18n ? window.i18n.getLang() : 'es';
        if (window.i18n) window.i18n.setLang(curr === 'es' ? 'en' : 'es');
    });
}

function _syncLangBtn() {
    var btn = document.getElementById('about-lang-btn');
    if (btn && window.i18n) btn.textContent = window.i18n.getLang().toUpperCase();
}

function _render() {
    _renderStack();
    _renderCreators();
    if (window.i18n) window.i18n.applyDOM();
}

function _renderStack() {
    var el = document.getElementById('about-stack');
    if (!el) return;
    el.innerHTML = _STACK.map(function (item) {
        return '<div class="about-stack-item">' +
            '<strong class="about-stack-name">' + item.label + '</strong>' +
            '<span class="about-stack-desc">' + t('about.stack.' + item.key) + '</span>' +
            '</div>';
    }).join('');
}

function _renderCreators() {
    var el = document.getElementById('about-creators');
    if (!el) return;
    var role = t('about.creators.role');
    el.innerHTML = _CREATORS.map(function (c) {
        var initials = c.name.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('');
        var avatarUrl = 'https://avatars.githubusercontent.com/' + c.username + '?s=80';
        return '<div class="about-creator">' +
            '<img class="about-creator-avatar about-creator-avatar--img" src="' + avatarUrl + '" alt="' + initials + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
            '<div class="about-creator-avatar" style="display:none">' + initials + '</div>' +
            '<div class="about-creator-info">' +
            '<strong class="about-creator-name">' + c.name + '</strong>' +
            '<span class="about-creator-role">' + role + '</span>' +
            '</div>' +
            '<a href="' + c.github + '" target="_blank" rel="noopener" class="about-creator-gh" title="GitHub">' +
            '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>' +
            '</a>' +
            '</div>';
    }).join('');
}

init();

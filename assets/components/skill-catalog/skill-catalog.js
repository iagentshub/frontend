// skill-catalog.js — directorio de búsqueda de skills públicas
'use strict';

var SkillCatalog = (function () {
    var _skills = [];
    var _onImport = null;
    var _query = '';

    var _SVG_SEARCH = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    var _SVG_FALLBACK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

    function _publicSkills() {
        return _skills.filter(function (s) { return (s.scope || 'public') === 'public'; });
    }

    function _filtered() {
        var q = _query.toLowerCase().trim();
        var pub = _publicSkills();
        if (!q) return pub;
        return pub.filter(function (s) {
            return s.name.toLowerCase().indexOf(q) !== -1 ||
                (s.description || '').toLowerCase().indexOf(q) !== -1;
        });
    }

    function _renderCard(s) {
        var iconHtml = s.icon
            ? '<span class="sc-card-icon">' + esc(s.icon) + '</span>'
            : '<span class="sc-card-icon sc-card-icon--fallback">' + _SVG_FALLBACK + '</span>';
        var catLabel = s.category
            ? '<span class="sc-card-category">' + esc(s.category) + '</span>'
            : '';
        return '<div class="sc-card">' +
            '<div class="sc-card-body">' +
            '<div class="sc-card-head">' + iconHtml + '<span class="sc-card-name">' + esc(s.name) + '</span>' + catLabel + '</div>' +
            '<div class="sc-card-desc">' + esc(s.description || '') + '</div>' +
            '</div>' +
            '<div class="sc-card-footer">' +
            '<button class="sc-import-btn" data-id="' + esc(s.id) + '">' + esc(t('skills.catalog.import_btn')) + '</button>' +
            '</div>' +
            '</div>';
    }

    function _renderGrid() {
        var grid = document.getElementById('sc-grid');
        if (!grid) return;
        var list = _filtered();
        if (!list.length) {
            grid.innerHTML = '<div class="sc-empty">' +
                esc(_query ? t('skills.catalog.empty_search') : t('skills.catalog.empty')) +
                '</div>';
            return;
        }
        grid.innerHTML = list.map(_renderCard).join('');
        grid.querySelectorAll('.sc-import-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var skill = _skills.find(function (s) { return s.id === btn.dataset.id; });
                if (skill && typeof _onImport === 'function') {
                    _close();
                    _onImport(skill);
                }
            });
        });
    }

    function _open() {
        _query = '';
        var bg = document.getElementById('skill-catalog-bg');
        if (!bg) return;
        bg.style.display = 'flex';
        _renderGrid();
        var inp = document.getElementById('sc-search');
        if (inp) { inp.value = ''; setTimeout(function () { inp.focus(); }, 60); }
    }

    function _close() {
        var bg = document.getElementById('skill-catalog-bg');
        if (bg) bg.style.display = 'none';
    }

    return {
        init: function (opts) {
            _onImport = opts.onImport || null;

            var mountEl = typeof opts.mountEl === 'string'
                ? document.querySelector(opts.mountEl)
                : opts.mountEl;
            if (mountEl) mountEl.addEventListener('click', _open);

            var closeBtn = document.getElementById('sc-close');
            if (closeBtn) closeBtn.addEventListener('click', _close);

            var bg = document.getElementById('skill-catalog-bg');
            if (bg) bg.addEventListener('click', function (e) {
                if (e.target === bg) _close();
            });

            var searchEl = document.getElementById('sc-search');
            if (searchEl) {
                searchEl.addEventListener('input', function (e) {
                    _query = e.target.value;
                    _renderGrid();
                });
            }

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') _close();
            });
        },

        setSkills: function (skills) {
            _skills = skills || [];
        },

        open: _open,
    };
}());

window.SkillCatalog = SkillCatalog;

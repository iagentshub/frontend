// knowledge-urls.js — gestión de URLs en la pestaña Conocimiento
'use strict';

var KnowledgeUrls = (function () {
    var _items = [];
    var _loaded = false;

    function init() {
        document.getElementById('btn-add-url').addEventListener('click', _openModal);
        document.getElementById('url-modal-close').addEventListener('click', _closeModal);
        document.getElementById('url-modal-cancel').addEventListener('click', _closeModal);
        document.getElementById('url-modal-save').addEventListener('click', _submit);
        document.getElementById('url-input').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') _submit();
        });
        document.getElementById('urls-grid').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-del-id]');
            if (btn) _deleteItem(btn.dataset.delId);
        });
    }

    async function load() {
        if (_loaded) { _render(); return; }
        try {
            _items = await api.get('/api/knowledge?type=url');
            _loaded = true;
        } catch (e) {
            _items = [];
        }
        _render();
    }

    function _render() {
        var grid = document.getElementById('urls-grid');
        if (!grid) return;
        if (!_items.length) {
            grid.innerHTML = '<p class="knowledge-empty">' + (t('skills.knowledge.empty_urls') || 'Sin URLs todavía.') + '</p>';
            return;
        }
        grid.innerHTML = _items.map(function (item) {
            var warn = item.char_count > 8000
                ? '<span class="knowledge-warn" title="' + esc(t('skills.knowledge.char_warning') || 'Texto largo') + '">⚠</span>'
                : '';
            return '<div class="knowledge-card">' +
                '<div class="knowledge-card-header">' +
                '<span class="knowledge-card-icon">🔗</span>' +
                '<span class="knowledge-card-title">' + esc(item.title) + '</span>' +
                warn +
                '<button class="knowledge-del-btn" data-del-id="' + esc(item.id) + '" title="' + esc(t('common.actions.delete') || 'Eliminar') + '">×</button>' +
                '</div>' +
                '<a class="knowledge-card-source" href="' + esc(item.source) + '" target="_blank" rel="noopener">' + esc(item.source) + '</a>' +
                '<div class="knowledge-card-meta">' + esc(_fmtChars(item.char_count)) + '</div>' +
                '</div>';
        }).join('');
    }

    function _openModal() {
        document.getElementById('url-input').value = '';
        document.getElementById('url-title-input').value = '';
        document.getElementById('url-modal').style.display = 'flex';
        setTimeout(function () { document.getElementById('url-input').focus(); }, 60);
    }

    function _closeModal() {
        document.getElementById('url-modal').style.display = 'none';
    }

    async function _submit() {
        var url = document.getElementById('url-input').value.trim();
        var title = document.getElementById('url-title-input').value.trim();
        if (!url) return;
        var btn = document.getElementById('url-modal-save');
        btn.disabled = true;
        btn.textContent = t('skills.knowledge.fetching') || 'Obteniendo URL…';
        try {
            var item = await api.post('/api/knowledge/url', { url: url, title: title || url });
            _items.unshift(item);
            _render();
            _closeModal();
            toast(item.title, 'success');
        } catch (e) {
            toast((t('skills.knowledge.fetch_error') || 'Error: {{msg}}').replace('{{msg}}', e.message), 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = t('skills.knowledge.add_url_btn') || 'Añadir URL';
        }
    }

    async function _deleteItem(id) {
        if (!confirm(t('skills.knowledge.confirm_delete') || '¿Eliminar?')) return;
        try {
            await api.del('/api/knowledge/' + encodeURIComponent(id));
            _items = _items.filter(function (i) { return i.id !== id; });
            _render();
            toast(t('skills.knowledge.deleted') || 'Eliminado', 'info');
        } catch (e) { toast(e.message, 'error'); }
    }

    function _fmtChars(n) {
        if (!n) return '0 chars';
        var label = t('skills.knowledge.char_count') || '{{n}} caracteres';
        if (n >= 1000) return label.replace('{{n}}', (n / 1000).toFixed(1) + 'k');
        return label.replace('{{n}}', String(n));
    }

    function getItems() { return _items; }

    return { init: init, load: load, getItems: getItems };
})();

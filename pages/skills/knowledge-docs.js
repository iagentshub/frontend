// knowledge-docs.js — gestión de documentos en la pestaña Conocimiento
'use strict';

var KnowledgeDocs = (function () {
    var _items = [];
    var _loaded = false;

    function init() {
        document.getElementById('btn-upload-doc').addEventListener('click', function () {
            document.getElementById('doc-file-input').click();
        });
        document.getElementById('doc-file-input').addEventListener('change', function (e) {
            var file = e.target.files[0];
            e.target.value = '';
            if (file) _upload(file);
        });

        // Drag & drop
        var dropzone = document.getElementById('docs-dropzone');
        if (dropzone) {
            dropzone.addEventListener('click', function () {
                document.getElementById('doc-file-input').click();
            });
            dropzone.addEventListener('dragover', function (e) {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            });
            dropzone.addEventListener('dragleave', function () {
                dropzone.classList.remove('drag-over');
            });
            dropzone.addEventListener('drop', function (e) {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
                var file = e.dataTransfer.files[0];
                if (file) _upload(file);
            });
        }

        document.getElementById('docs-grid').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-del-id]');
            if (btn) _deleteItem(btn.dataset.delId);
        });
    }

    async function load() {
        if (_loaded) { _render(); return; }
        try {
            _items = await api.get('/api/knowledge?type=document');
            _loaded = true;
        } catch (e) {
            _items = [];
        }
        _render();
    }

    function _render() {
        var grid = document.getElementById('docs-grid');
        if (!grid) return;
        if (!_items.length) {
            grid.innerHTML = '<p class="knowledge-empty">' + (t('skills.knowledge.empty_docs') || 'Sin documentos todavía.') + '</p>';
            return;
        }
        grid.innerHTML = _items.map(function (item) {
            var icon = item.source.toLowerCase().endsWith('.pdf') ? '📄' : '📝';
            var warn = item.char_count > 8000
                ? '<span class="knowledge-warn" title="' + esc(t('skills.knowledge.char_warning') || 'Texto largo') + '">⚠</span>'
                : '';
            return '<div class="knowledge-card">' +
                '<div class="knowledge-card-header">' +
                '<span class="knowledge-card-icon">' + icon + '</span>' +
                '<span class="knowledge-card-title">' + esc(item.title) + '</span>' +
                warn +
                '<button class="knowledge-del-btn" data-del-id="' + esc(item.id) + '" title="' + esc(t('common.actions.delete') || 'Eliminar') + '">×</button>' +
                '</div>' +
                '<div class="knowledge-card-source">' + esc(item.source) + '</div>' +
                '<div class="knowledge-card-meta">' + esc(_fmtChars(item.char_count)) + '</div>' +
                '</div>';
        }).join('');
    }

    async function _upload(file) {
        var allowed = ['.txt', '.md', '.pdf'];
        var ext = file.name.includes('.') ? '.' + file.name.split('.').pop().toLowerCase() : '';
        if (!allowed.includes(ext)) {
            toast((t('skills.knowledge.formats_hint') || 'Formatos: .txt .md .pdf'), 'error');
            return;
        }
        var btnUpload = document.getElementById('btn-upload-doc');
        btnUpload.disabled = true;
        var origText = btnUpload.querySelector('span') ? btnUpload.querySelector('span').textContent : '';
        if (btnUpload.querySelector('span')) btnUpload.querySelector('span').textContent = t('skills.knowledge.uploading') || 'Subiendo…';
        try {
            var fd = new FormData();
            fd.append('file', file);
            var resp = await fetch('/api/knowledge/document', {
                method: 'POST',
                body: fd,
            });
            if (!resp.ok) {
                var err = await resp.json().catch(function () { return { detail: resp.statusText }; });
                throw new Error(err.detail || resp.statusText);
            }
            var item = await resp.json();
            _items.unshift(item);
            _loaded = true;
            _render();
            toast(item.title, 'success');
        } catch (e) {
            toast((t('skills.knowledge.upload_error') || 'Error: {{msg}}').replace('{{msg}}', e.message), 'error');
        } finally {
            btnUpload.disabled = false;
            if (btnUpload.querySelector('span')) btnUpload.querySelector('span').textContent = origText;
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

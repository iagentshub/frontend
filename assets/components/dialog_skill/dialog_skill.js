/* dialog_skill.js — IIFE DialogSkill
   API pública:
     DialogSkill.open(skill | null, onSave)
     DialogSkill.close()
*/
var DialogSkill = (function () {
    var _CATEGORIES = [
        { id: 'ai', label: '🤖 IA y Agentes' },
        { id: 'messaging', label: '🗣️ Mensajería' },
        { id: 'notes', label: '📝 Notas' },
        { id: 'productivity', label: '✅ Productividad' },
        { id: 'dev', label: '💻 Desarrollo' },
        { id: 'security', label: '🔒 Seguridad' },
        { id: 'media', label: '🎬 Media' },
        { id: 'data', label: '🌐 Datos' },
        { id: 'company', label: '🏢 Empresa' },
    ];

    var _overlay = null;
    var _onSave = null;

    function open(skill, onSave) {
        _onSave = onSave || null;
        _render(skill || null);
    }

    function close() {
        if (_overlay && _overlay.parentNode) {
            _overlay.parentNode.removeChild(_overlay);
        }
        _overlay = null;
        _onSave = null;
    }

    function _render(skill) {
        // Remove existing overlay if any
        close();

        var isEdit = !!skill;
        var title = isEdit ? 'Editar skill privada' : 'Nueva skill privada';

        var catOptions = _CATEGORIES.map(function (c) {
            var sel = (skill && skill.category === c.id) ? ' selected' : '';
            return '<option value="' + esc(c.id) + '"' + sel + '>' + esc(c.label) + '</option>';
        }).join('');

        var html = [
            '<div class="dsk-overlay" id="dsk-overlay">',
            '  <div class="dsk-dialog" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">',
            '    <div class="dsk-header">',
            '      <span class="dsk-title">' + esc(title) + '</span>',
            '      <button class="dsk-close" id="dsk-close-btn" aria-label="Cerrar">',
            '        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
            '      </button>',
            '    </div>',
            '    <div class="dsk-body">',
            '      <div class="dsk-row">',
            '        <div class="dsk-field" style="flex:0 0 auto">',
            '          <label class="dsk-label" for="dsk-icon">Icono</label>',
            '          <input class="dsk-input dsk-input--icon" id="dsk-icon" type="text" maxlength="4" value="' + esc((skill && skill.icon) || '🔧') + '">',
            '        </div>',
            '        <div class="dsk-field">',
            '          <label class="dsk-label" for="dsk-name">Nombre <span style="color:var(--danger)">*</span></label>',
            '          <input class="dsk-input" id="dsk-name" type="text" placeholder="Mi skill..." value="' + esc((skill && skill.name) || '') + '">',
            '        </div>',
            '      </div>',
            '      <div class="dsk-field">',
            '        <label class="dsk-label" for="dsk-desc">Descripción</label>',
            '        <input class="dsk-input" id="dsk-desc" type="text" placeholder="Qué hace esta skill..." value="' + esc((skill && skill.description) || '') + '">',
            '      </div>',
            '      <div class="dsk-field">',
            '        <label class="dsk-label" for="dsk-category">Categoría</label>',
            '        <select class="dsk-select" id="dsk-category">',
            '          <option value="">Sin categoría</option>',
            catOptions,
            '        </select>',
            '      </div>',
            '      <div class="dsk-field">',
            '        <label class="dsk-label" for="dsk-content">Contenido (Markdown / instrucciones)</label>',
            '        <textarea class="dsk-textarea" id="dsk-content" placeholder="Instrucciones para el agente...">' + esc((skill && skill.content) || '') + '</textarea>',
            '      </div>',
            '    </div>',
            '    <div class="dsk-footer">',
            '      <button class="dsk-btn dsk-btn--cancel" id="dsk-cancel-btn">Cancelar</button>',
            '      <button class="dsk-btn dsk-btn--save" id="dsk-save-btn">Guardar</button>',
            '    </div>',
            '  </div>',
            '</div>',
        ].join('');

        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        _overlay = wrapper.firstElementChild;
        document.body.appendChild(_overlay);

        // Solo cerrar con X, Cancelar o Guardar — no al hacer click fuera
        document.getElementById('dsk-close-btn').addEventListener('click', close);
        document.getElementById('dsk-cancel-btn').addEventListener('click', close);
        document.getElementById('dsk-save-btn').addEventListener('click', function () {
            _submit(skill);
        });

        // Focus name on open
        setTimeout(function () {
            var nameEl = document.getElementById('dsk-name');
            if (nameEl) nameEl.focus();
        }, 50);
    }

    function _submit(existingSkill) {
        var name = (document.getElementById('dsk-name').value || '').trim();
        if (!name) {
            window.toast('El nombre es obligatorio', 'error');
            document.getElementById('dsk-name').focus();
            return;
        }

        var payload = {
            name: name,
            icon: (document.getElementById('dsk-icon').value || '🔧').trim(),
            description: (document.getElementById('dsk-desc').value || '').trim(),
            category: (document.getElementById('dsk-category').value || '').trim() || null,
            content: (document.getElementById('dsk-content').value || '').trim(),
        };

        // Preserve id if editing so backend can update same slug
        if (existingSkill && existingSkill.id) {
            payload.id = existingSkill.id;
        }

        var saveBtn = document.getElementById('dsk-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando…';

        window.api.post('/api/skills/private', payload)
            .then(function () {
                window.toast('Skill guardada', 'success');
                close();
                if (_onSave) _onSave();
            })
            .catch(function (err) {
                window.toast('Error: ' + (err.message || 'No se pudo guardar'), 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar';
            });
    }

    return { open: open, close: close };
})();

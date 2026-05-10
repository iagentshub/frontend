// agents-routines.js — gestión de rutinas en el modal de agente
'use strict';

var _routines = [];

function _syncRoutines(routines) {
    _routines = (routines || []).map(function (r) { return Object.assign({}, r); });
    _renderRoutinesList();
    _bindRoutineEvents();
}

function _getRoutines() {
    return _routines.slice();
}

function _renderRoutinesList() {
    var list = document.getElementById('routines-list');
    if (!list) return;
    if (!_routines.length) {
        list.innerHTML = '<div class="routine-empty">' + esc(t('agents.modal.routine_empty')) + '</div>';
        return;
    }
    list.innerHTML = _routines.map(function (r, i) { return _renderRoutineCard(r, i); }).join('');
}

function _renderRoutineCard(r, idx) {
    var triggerLabel = _triggerLabel(r.trigger_type, r.schedule);
    return '<div class="routine-card" data-routine-idx="' + idx + '">' +
        '<div class="routine-card-body">' +
        '<div class="routine-card-name">' + esc(r.name || '') + '</div>' +
        (r.description ? '<div class="routine-card-desc">' + esc(r.description) + '</div>' : '') +
        '</div>' +
        '<div class="routine-card-meta">' +
        '<span class="routine-badge routine-badge--' + esc(r.trigger_type || 'manual') + '">' + esc(triggerLabel) + '</span>' +
        '</div>' +
        '<div class="routine-card-actions">' +
        '<button type="button" class="routine-action-btn" data-routine-action="edit" data-routine-idx="' + idx + '">' + esc(t('agents.modal.routine_edit')) + '</button>' +
        '<button type="button" class="routine-action-btn routine-action-btn--del" data-routine-action="delete" data-routine-idx="' + idx + '">' + esc(t('agents.modal.routine_delete')) + '</button>' +
        '</div>' +
        '</div>';
}

function _renderRoutineForm(r, idx) {
    r = r || {};
    var triggerType = r.trigger_type || 'manual';
    var isNew = (idx === undefined || idx === null || idx === -1);
    var idxAttr = isNew ? '-1' : idx;
    return '<div class="routine-form" data-routine-form-idx="' + idxAttr + '">' +
        '<div class="routine-form-row">' +
        '<div class="field">' +
        '<label>' + esc(t('agents.modal.routine_name_label')) + ' *</label>' +
        '<input class="input routine-f-name" value="' + esc(r.name || '') + '" placeholder="' + esc(t('agents.modal.routine_name_label')) + '" />' +
        '</div>' +
        '<div class="field">' +
        '<label>' + esc(t('agents.modal.routine_trigger_label')) + '</label>' +
        '<select class="select routine-f-trigger">' +
        '<option value="manual"' + (triggerType === 'manual' ? ' selected' : '') + '>' + esc(t('agents.modal.routine_trigger_manual')) + '</option>' +
        '<option value="cron"' + (triggerType === 'cron' ? ' selected' : '') + '>' + esc(t('agents.modal.routine_trigger_cron')) + '</option>' +
        '<option value="webhook"' + (triggerType === 'webhook' ? ' selected' : '') + '>' + esc(t('agents.modal.routine_trigger_webhook')) + '</option>' +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div class="field routine-f-schedule-wrap" style="' + (triggerType !== 'cron' ? 'display:none' : '') + '">' +
        '<label>' + esc(t('agents.modal.routine_schedule_label')) + '</label>' +
        '<input class="input routine-f-schedule" value="' + esc(r.schedule || '') + '" ' +
        'data-i18n-placeholder="agents.modal.routine_schedule_placeholder" placeholder="ej: 0 9 * * MON-FRI" />' +
        '<span class="input-hint" data-i18n="agents.modal.routine_schedule_hint">' + esc(t('agents.modal.routine_schedule_hint')) + '</span>' +
        '</div>' +
        '<div class="field">' +
        '<label>' + esc(t('agents.modal.routine_desc_label')) + '</label>' +
        '<input class="input routine-f-desc" value="' + esc(r.description || '') + '" />' +
        '</div>' +
        '<div class="field">' +
        '<label>' + esc(t('agents.modal.routine_prompt_label')) + '</label>' +
        '<textarea class="textarea routine-f-prompt" style="min-height:72px" ' +
        'placeholder="' + esc(t('agents.modal.routine_prompt_placeholder')) + '">' + esc(r.prompt || '') + '</textarea>' +
        '</div>' +
        '<div class="routine-form-actions">' +
        '<button type="button" class="btn btn-primary btn-sm routine-f-save">' + esc(t('agents.modal.routine_save')) + '</button>' +
        '<button type="button" class="btn btn-ghost btn-sm routine-f-cancel" data-i18n="common.actions.cancel">' + esc(t('common.actions.cancel')) + '</button>' +
        '</div>' +
        '</div>';
}

function _triggerLabel(triggerType, schedule) {
    if (triggerType === 'cron') return (schedule || t('agents.modal.routine_trigger_cron'));
    if (triggerType === 'webhook') return t('agents.modal.routine_trigger_webhook');
    return t('agents.modal.routine_trigger_manual');
}

function _bindRoutineEvents() {
    var list = document.getElementById('routines-list');
    if (!list) return;

    list.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-routine-action]');
        if (!btn) return;
        var action = btn.dataset.routineAction;
        var idx = parseInt(btn.dataset.routineIdx, 10);

        if (action === 'delete') {
            _routines.splice(idx, 1);
            _renderRoutinesList();
            _bindRoutineEvents();
        } else if (action === 'edit') {
            var card = list.querySelector('[data-routine-idx="' + idx + '"]');
            if (!card) return;
            card.outerHTML = _renderRoutineForm(_routines[idx], idx);
            _bindFormEvents(list.querySelector('[data-routine-form-idx="' + idx + '"]'));
        }
    });
}

function _bindFormEvents(formEl) {
    if (!formEl) return;
    var triggerSel = formEl.querySelector('.routine-f-trigger');
    var scheduleWrap = formEl.querySelector('.routine-f-schedule-wrap');

    triggerSel.addEventListener('change', function () {
        scheduleWrap.style.display = triggerSel.value === 'cron' ? '' : 'none';
    });

    formEl.querySelector('.routine-f-save').addEventListener('click', function () {
        var name = formEl.querySelector('.routine-f-name').value.trim();
        if (!name) { formEl.querySelector('.routine-f-name').focus(); return; }
        var obj = {
            name: name,
            description: formEl.querySelector('.routine-f-desc').value.trim(),
            trigger_type: triggerSel.value,
            schedule: triggerSel.value === 'cron' ? formEl.querySelector('.routine-f-schedule').value.trim() : '',
            prompt: formEl.querySelector('.routine-f-prompt').value.trim(),
        };
        var idx = parseInt(formEl.dataset.routineFormIdx, 10);
        if (idx === -1) {
            _routines.push(obj);
        } else {
            _routines[idx] = obj;
        }
        _renderRoutinesList();
        _bindRoutineEvents();
    });

    formEl.querySelector('.routine-f-cancel').addEventListener('click', function () {
        var idx = parseInt(formEl.dataset.routineFormIdx, 10);
        if (idx === -1) {
            _renderRoutinesList();
            _bindRoutineEvents();
        } else {
            _renderRoutinesList();
            _bindRoutineEvents();
        }
    });
}

// "Añadir rutina" button
document.addEventListener('click', function (e) {
    if (e.target.id === 'btn-add-routine' || e.target.closest('#btn-add-routine')) {
        var list = document.getElementById('routines-list');
        if (!list) return;
        // Don't add a second form if one already exists
        if (list.querySelector('.routine-form')) return;
        var formHtml = _renderRoutineForm(null, -1);
        var div = document.createElement('div');
        div.innerHTML = formHtml;
        list.appendChild(div.firstChild);
        _bindFormEvents(list.querySelector('[data-routine-form-idx="-1"]'));
    }
});

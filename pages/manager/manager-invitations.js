'use strict';

function renderInvitations(invitations) {
    var wrap = document.getElementById('invitations-table-wrap');
    if (!invitations.length) {
        wrap.innerHTML = '<div class="admin-empty">' + t('manager.manager.invitations.none') + '</div>';
        return;
    }

    var rows = invitations.map(function (inv) {
        var date = inv.created_at
            ? new Date(inv.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
            : '—';
        return '<tr>' +
            '<td>' + esc(inv.invited_email) + '</td>' +
            '<td class="td-date">' + date + '</td>' +
            '<td class="td-actions">' +
            '<button class="btn btn-ghost btn-sm action-item--danger" data-cancel-inv="' + esc(inv.id) + '">' +
            t('manager.manager.invitations.cancel') +
            '</button>' +
            '</td></tr>';
    }).join('');

    wrap.innerHTML =
        '<table class="admin-table">' +
        '<thead><tr>' +
        '<th>' + t('manager.manager.invitations.table_email') + '</th>' +
        '<th>' + t('manager.manager.invitations.table_date') + '</th>' +
        '<th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';

    wrap.querySelectorAll('[data-cancel-inv]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
            if (!confirm(t('manager.manager.invitations.confirm_cancel'))) return;
            try {
                await api.del('/api/teams/' + _managerTeamId + '/invitations/' + encodeURIComponent(btn.dataset.cancelInv));
                toast(t('manager.manager.invitations.cancel') + ' ✓', 'success');
                await _reloadInvitations();
            } catch (err) { toast(err.message || 'Error', 'error'); }
        });
    });
}

async function _reloadInvitations() {
    if (!_managerTeamId) return;
    var invs = await api.get('/api/teams/' + _managerTeamId + '/invitations');
    renderInvitations(invs);
}

(function _bindSendInvite() {
    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('btn-send-invite');
        var emailInput = document.getElementById('invite-email');
        if (!btn || !emailInput) return;

        btn.addEventListener('click', async function () {
            var email = (emailInput.value || '').trim().toLowerCase();
            if (!email) return;
            if (!_managerTeamId) { toast('No hay equipo seleccionado', 'error'); return; }
            try {
                btn.disabled = true;
                await api.post('/api/teams/' + _managerTeamId + '/invitations', { email: email });
                toast(t('manager.manager.invitations.success'), 'success');
                emailInput.value = '';
                await _reloadInvitations();
            } catch (err) {
                toast(err.message || 'Error', 'error');
            } finally {
                btn.disabled = false;
            }
        });

        emailInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') btn.click();
        });
    });
}());

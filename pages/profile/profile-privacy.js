(function () {
    'use strict';

    var _pendingWorkspaces = [];
    var _resolveWsModal    = document.getElementById('modal-resolve-ws');
    var _transferWsModal   = document.getElementById('modal-transfer-ws');

    // ── Estado de borrado ─────────────────────────────────────────────────────

    async function loadDeletionStatus() {
        try {
            var status = await api.get('/api/auth/me/deletion-status');
            var banner = document.getElementById('deletion-banner');
            var reqBtn = document.getElementById('btn-request-deletion');
            if (status.scheduled && status.deletion_date) {
                var d = new Date(status.deletion_date);
                var fmt = d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
                document.getElementById('deletion-banner-date').textContent =
                    t('profile.privacy.deletion_scheduled_date', { date: fmt }) ||
                    'Tu cuenta se eliminará el ' + fmt;
                banner.style.display = 'block';
                if (reqBtn) reqBtn.disabled = true;
            } else {
                banner.style.display = 'none';
                if (reqBtn) reqBtn.disabled = false;
            }
        } catch (err) { console.error('[profile-privacy] Error cargando estado de borrado:', err); }
    }

    // ── Exportar datos ────────────────────────────────────────────────────────

    document.getElementById('btn-export-data').addEventListener('click', function () {
        var btn = this;
        btn.disabled = true;
        btn.textContent = t('profile.privacy.export_loading') || 'Preparando…';
        var a = document.createElement('a');
        a.href = '/api/auth/me/export';
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () {
            btn.disabled = false;
            btn.textContent = t('profile.privacy.export_btn') || 'Descargar mis datos';
        }, 2000);
    });

    // ── Cancelar eliminación ──────────────────────────────────────────────────

    document.getElementById('btn-cancel-deletion').addEventListener('click', async function () {
        var btn = this;
        var token = new URLSearchParams(window.location.search).get('deletion_token') || '';
        if (!token) {
            toast(t('profile.privacy.cancel_no_token') || 'Usa el enlace del email para cancelar.', 'error');
            return;
        }
        btn.disabled = true;
        try {
            await api.post('/api/auth/me/cancel-deletion', { token: token });
            toast(t('profile.privacy.cancel_ok') || 'Eliminación cancelada.', 'success');
            loadDeletionStatus();
        } catch (err) {
            toast(err.message || t('profile.privacy.cancel_error') || 'Error al cancelar.', 'error');
        } finally {
            btn.disabled = false;
        }
    });

    // ── Solicitar eliminación ─────────────────────────────────────────────────

    document.getElementById('btn-request-deletion').addEventListener('click', async function () {
        try {
            await api.post('/api/auth/me/request-deletion', {});
            toast(t('profile.privacy.delete_ok') || 'Eliminación programada. Recibirás un email de confirmación.', 'success');
            loadDeletionStatus();
        } catch (err) {
            if (err.status === 409 && err.data && err.data.workspaces) {
                _pendingWorkspaces = err.data.workspaces;
                _openResolveWsModal();
            } else {
                toast(err.message || t('profile.privacy.delete_error') || 'Error al solicitar eliminación.', 'error');
            }
        }
    });

    // ── Modal: resolver workspaces ────────────────────────────────────────────

    function _openResolveWsModal() {
        var list = document.getElementById('resolve-ws-list');
        list.innerHTML = _pendingWorkspaces.map(function (ws) {
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line)">' +
                '<span style="font-weight:500">' + esc(ws.name) + '</span>' +
                '<div style="display:flex;gap:8px">' +
                    '<button class="btn btn-ghost btn-sm" data-ws-id="' + esc(ws.id) + '" data-action="transfer">' +
                        (t('profile.privacy.btn_transfer') || 'Transferir') +
                    '</button>' +
                    '<button class="btn btn-danger btn-sm" data-ws-id="' + esc(ws.id) + '" data-action="delete">' +
                        (t('profile.privacy.btn_delete_ws') || 'Eliminar') +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        list.querySelectorAll('[data-action="transfer"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.getElementById('transfer-ws-id').value = this.dataset.wsId;
                document.getElementById('transfer-ws-username').value = '';
                _resolveWsModal.style.display = 'none';
                _transferWsModal.style.display = 'flex';
            });
        });

        list.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                var wsId = this.dataset.wsId;
                if (!confirm(t('profile.privacy.confirm_delete_ws') || '¿Eliminar este grupo? Los recursos originales de sus dueños no se eliminan.')) return;
                try {
                    await api.delete('/api/workspaces/' + wsId);
                    _pendingWorkspaces = _pendingWorkspaces.filter(function (w) { return w.id !== wsId; });
                    if (_pendingWorkspaces.length === 0) {
                        _resolveWsModal.style.display = 'none';
                        _tryRequestDeletion();
                    } else {
                        _openResolveWsModal();
                    }
                } catch (err) {
                    toast(err.message || 'Error al eliminar grupo', 'error');
                }
            });
        });

        _resolveWsModal.style.display = 'flex';
    }

    document.getElementById('btn-resolve-ws-close').addEventListener('click', function () {
        _resolveWsModal.style.display = 'none';
    });
    document.getElementById('btn-resolve-ws-cancel').addEventListener('click', function () {
        _resolveWsModal.style.display = 'none';
    });

    // ── Modal: transferir workspace ───────────────────────────────────────────

    document.getElementById('btn-transfer-ws-close').addEventListener('click', function () {
        _transferWsModal.style.display = 'none';
        _resolveWsModal.style.display = 'flex';
    });
    document.getElementById('btn-transfer-ws-cancel').addEventListener('click', function () {
        _transferWsModal.style.display = 'none';
        _resolveWsModal.style.display = 'flex';
    });

    document.getElementById('btn-transfer-ws-confirm').addEventListener('click', async function () {
        var wsId    = document.getElementById('transfer-ws-id').value;
        var newUser = document.getElementById('transfer-ws-username').value.trim();
        if (!newUser) { toast(t('profile.privacy.transfer_user_required') || 'Introduce un usuario', 'error'); return; }
        var btn = this;
        btn.disabled = true;
        try {
            await api.post('/api/workspaces/' + wsId + '/transfer-ownership', { username: newUser });
            toast(t('profile.privacy.transfer_ok') || 'Propiedad transferida', 'success');
            _pendingWorkspaces = _pendingWorkspaces.filter(function (w) { return w.id !== wsId; });
            _transferWsModal.style.display = 'none';
            if (_pendingWorkspaces.length === 0) {
                _tryRequestDeletion();
            } else {
                _openResolveWsModal();
            }
        } catch (err) {
            toast(err.message || t('profile.privacy.transfer_error') || 'Error al transferir', 'error');
        } finally {
            btn.disabled = false;
        }
    });

    async function _tryRequestDeletion() {
        try {
            await api.post('/api/auth/me/request-deletion', {});
            toast(t('profile.privacy.delete_ok') || 'Eliminación programada en 30 días.', 'success');
            loadDeletionStatus();
        } catch (err) {
            toast(err.message || 'Error al solicitar eliminación', 'error');
        }
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    // Carga el estado al entrar en la sección
    document.querySelector('[data-section="section-privacy"]').addEventListener('click', loadDeletionStatus);

    // Si hay token de cancelación en la URL, procesa automáticamente
    (function () {
        var params = new URLSearchParams(window.location.search);
        var cancelToken = params.get('deletion_token');
        if (cancelToken && window.location.pathname.includes('/profile')) {
            api.post('/api/auth/me/cancel-deletion', { token: cancelToken })
                .then(function () {
                    toast(t('profile.privacy.cancel_ok') || 'Eliminación cancelada.', 'success');
                    loadDeletionStatus();
                    // Limpiar parámetro de la URL
                    var url = new URL(window.location);
                    url.searchParams.delete('deletion_token');
                    window.history.replaceState({}, '', url);
                })
                .catch(function () {});
        }
    }());
}());

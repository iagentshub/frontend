(function () {
    'use strict';

    var _workspaces    = [];
    var _myInvitations = [];
    var _currentWs     = null;
    var _currentMembers = [];
    var _currentPending = [];
    var _canManage     = false;
    var _me            = null;

    // ── Helpers ────────────────────────────────────────────────────────────────

    function _fmtDate(iso) {
        if (!iso) return '';
        return iso.slice(0, 10);
    }

    function _roleLabel(role) {
        return role === 'owner' ? 'Propietario' : role === 'admin' ? 'Admin' : 'Miembro';
    }

    // ── Load ───────────────────────────────────────────────────────────────────

    function load() {
        Promise.all([
            api.get('/api/workspaces').catch(function () { return []; }),
            api.get('/api/workspaces/my-invitations').catch(function () { return []; }),
        ]).then(function (results) {
            _workspaces    = results[0] || [];
            _myInvitations = results[1] || [];
            _renderMine();
            _renderInvitations();
            _updateInvBadge();
        });
    }

    // ── Tab switching ──────────────────────────────────────────────────────────

    function _bindTabs() {
        var tabs = document.querySelectorAll('[data-ws-tab]');
        tabs.forEach(function (btn) {
            btn.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                btn.classList.add('active');
                var tab = btn.getAttribute('data-ws-tab');
                document.getElementById('ws-panel-mine').style.display = tab === 'mine' ? '' : 'none';
                document.getElementById('ws-panel-invitations').style.display = tab === 'invitations' ? '' : 'none';
            });
        });
    }

    // ── "Mis workspaces" panel ─────────────────────────────────────────────────

    function _renderMine() {
        var wrap = document.getElementById('ws-list-wrap');
        if (!wrap) return;
        var teams = _workspaces.filter(function (w) { return w.type === 'team'; });
        if (!teams.length) {
            wrap.innerHTML = '<p class="profile-empty-msg">No perteneces a ningún grupo de trabajo.</p>';
            return;
        }
        wrap.innerHTML = teams.map(function (ws) {
            var canManage = ws.role === 'owner' || ws.role === 'admin';
            return '<div class="profile-ws-card">' +
                '<div class="profile-ws-info">' +
                '<span class="profile-ws-name">' + esc(ws.name) + '</span>' +
                '<span class="profile-ws-role">' + esc(_roleLabel(ws.role)) + '</span>' +
                '</div>' +
                '<button class="btn btn-ghost btn-sm" data-ws-manage="' + esc(ws.id) + '">' +
                (canManage ? 'Gestionar' : 'Ver') + '</button>' +
                '</div>';
        }).join('');

        wrap.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-ws-manage]');
            if (btn) { _openMembersModal(btn.getAttribute('data-ws-manage')); }
        });
    }

    // ── Members modal ──────────────────────────────────────────────────────────

    function _openMembersModal(wsId) {
        _currentWs = _workspaces.find(function (w) { return w.id === wsId; }) || null;
        if (!_currentWs) return;
        _canManage = _currentWs.role === 'owner' || _currentWs.role === 'admin';
        var isOwner = _currentWs.role === 'owner';

        document.getElementById('ws-members-modal-title').textContent = _currentWs.name;
        document.getElementById('ws-invite-section').style.display = _canManage ? '' : 'none';
        document.getElementById('ws-pending-section').style.display = _canManage ? '' : 'none';
        document.getElementById('ws-invite-username').value = '';

        var dangerZone = document.getElementById('ws-danger-zone');
        if (dangerZone) dangerZone.style.display = isOwner ? '' : 'none';
        var leaveZone = document.getElementById('ws-leave-zone');
        if (leaveZone) leaveZone.style.display = isOwner ? 'none' : '';
        _renderDangerZone();

        _ensureMe().then(_reloadModalData);
        document.getElementById('modal-ws-members').style.display = '';
    }

    function _ensureMe() {
        if (_me) return Promise.resolve(_me);
        return api.get('/api/auth/me').then(function (d) {
            _me = d.username;
            return _me;
        }).catch(function () { return null; });
    }

    function _renderDangerZone() {
        var toggleBtn = document.getElementById('btn-ws-toggle-status');
        if (!toggleBtn || !_currentWs) return;
        var isDisabled = _currentWs.status === 'disabled';
        toggleBtn.textContent = isDisabled ? 'Reactivar grupo' : 'Desactivar grupo';
    }

    function _reloadModalData() {
        if (!_currentWs) return;
        var wsId = _currentWs.id;
        Promise.all([
            api.get('/api/workspaces/' + wsId + '/members').catch(function () { return []; }),
            _canManage
                ? api.get('/api/workspaces/' + wsId + '/invitations').catch(function () { return []; })
                : Promise.resolve([]),
        ]).then(function (results) {
            _currentMembers = results[0] || [];
            _currentPending = results[1] || [];
            _renderModalMembers();
            _renderModalPending();
        });
    }

    function _closeModal() {
        document.getElementById('modal-ws-members').style.display = 'none';
        _currentWs = null;
    }

    function _renderModalMembers() {
        var el = document.getElementById('ws-members-list');
        if (!el) return;
        if (!_currentMembers.length) {
            el.innerHTML = '<p class="profile-empty-msg">Sin miembros.</p>';
            return;
        }
        el.innerHTML = '<table class="admin-table" style="width:100%"><thead><tr>' +
            '<th>Usuario</th><th>Rol</th><th>Desde</th>' + (_canManage ? '<th></th>' : '') + '</tr></thead><tbody>' +
            _currentMembers.map(function (m) {
                var isOwner = m.role === 'owner';
                var removeBtn = (_canManage && !isOwner)
                    ? '<button class="btn btn-ghost btn-sm btn-danger-hover" data-remove-member="' + esc(m.username) + '">Quitar</button>'
                    : '';
                return '<tr>' +
                    '<td>' + esc(m.display_name || m.username) + '</td>' +
                    '<td><span class="status-badge">' + esc(_roleLabel(m.role)) + '</span></td>' +
                    '<td style="color:var(--ink-3);font-size:0.78rem">' + esc(_fmtDate(m.joined_at)) + '</td>' +
                    (_canManage ? '<td>' + removeBtn + '</td>' : '') +
                    '</tr>';
            }).join('') +
            '</tbody></table>';

        el.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-remove-member]');
            if (!btn || !_currentWs) return;
            var uname = btn.getAttribute('data-remove-member');
            if (!confirm('¿Quitar a ' + uname + ' del grupo?')) return;
            api.del('/api/workspaces/' + _currentWs.id + '/members/' + encodeURIComponent(uname))
                .then(function () {
                    toast('Miembro eliminado', 'success');
                    _reloadModalData();
                })
                .catch(function (err) { toast(err.detail || 'Error', 'error'); });
        });
    }

    function _renderModalPending() {
        var el = document.getElementById('ws-pending-list');
        if (!el) return;
        if (!_currentPending.length) {
            el.innerHTML = '<p class="profile-empty-msg" style="color:var(--ink-3);font-size:0.82rem">Sin invitaciones pendientes.</p>';
            return;
        }
        el.innerHTML = _currentPending.map(function (inv) {
            return '<div class="ws-inv-row">' +
                '<span class="ws-inv-username">' + esc(inv.username) + '</span>' +
                '<button class="btn btn-ghost btn-sm btn-danger-hover" data-cancel-inv="' + esc(inv.id) + '">Cancelar</button>' +
                '</div>';
        }).join('');

        el.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-cancel-inv]');
            if (!btn || !_currentWs) return;
            var invId = btn.getAttribute('data-cancel-inv');
            api.del('/api/workspaces/' + _currentWs.id + '/invitations/' + invId)
                .then(function () {
                    toast('Invitacion cancelada', 'success');
                    _reloadModalData();
                })
                .catch(function (err) { toast(err.detail || 'Error', 'error'); });
        });
    }


    function _bindInviteBtn() {
        var btn = document.getElementById('btn-ws-invite');
        var input = document.getElementById('ws-invite-username');
        if (!btn || !input) return;
        btn.addEventListener('click', function () {
            var uname = (input.value || '').trim().toLowerCase();
            if (!uname || !_currentWs) return;
            btn.disabled = true;
            api.post('/api/workspaces/' + _currentWs.id + '/invitations', { username: uname })
                .then(function (inv) {
                    _currentPending.unshift(inv);
                    _renderModalPending();
                    input.value = '';
                    toast('Invitacion enviada a ' + uname, 'success');
                })
                .catch(function (err) { toast(err.detail || 'Error al invitar', 'error'); })
                .finally(function () { btn.disabled = false; });
        });
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
    }

    // ── "Invitaciones" panel ───────────────────────────────────────────────────

    function _updateInvBadge() {
        var badge = document.getElementById('ws-inv-badge');
        if (!badge) return;
        var n = _myInvitations.length;
        badge.textContent = n;
        badge.style.display = n > 0 ? '' : 'none';
    }

    function _renderInvitations() {
        var wrap = document.getElementById('ws-inv-wrap');
        if (!wrap) return;
        if (!_myInvitations.length) {
            wrap.innerHTML = '<p class="profile-empty-msg">No tienes invitaciones pendientes.</p>';
            return;
        }
        wrap.innerHTML = _myInvitations.map(function (inv) {
            return '<div class="ws-inv-received-card" data-inv-id="' + esc(inv.id) + '">' +
                '<div class="ws-inv-info">' +
                '<span class="ws-inv-ws-name">' + esc(inv.workspace_name || inv.workspace_id) + '</span>' +
                '<span class="ws-inv-from">Invitado por <strong>' + esc(inv.invited_by) + '</strong></span>' +
                '</div>' +
                '<div class="ws-inv-actions">' +
                '<button class="btn btn-primary btn-sm" data-inv-accept="' + esc(inv.id) + '">Aceptar</button>' +
                '<button class="btn btn-ghost btn-sm" data-inv-reject="' + esc(inv.id) + '">Rechazar</button>' +
                '</div>' +
                '</div>';
        }).join('');

        wrap.addEventListener('click', function (e) {
            var accept = e.target.closest('[data-inv-accept]');
            var reject = e.target.closest('[data-inv-reject]');
            if (accept) {
                var id = accept.getAttribute('data-inv-accept');
                api.post('/api/workspaces/invitations/' + id + '/accept', {})
                    .then(function () {
                        _myInvitations = _myInvitations.filter(function (i) { return i.id !== id; });
                        _renderInvitations();
                        _updateInvBadge();
                        api.get('/api/workspaces').then(function (ws) {
                            _workspaces = ws;
                            _renderMine();
                        });
                        toast('Te has unido al grupo', 'success');
                    })
                    .catch(function (err) { toast(err.detail || 'Error', 'error'); });
            }
            if (reject) {
                var id = reject.getAttribute('data-inv-reject');
                api.post('/api/workspaces/invitations/' + id + '/reject', {})
                    .then(function () {
                        _myInvitations = _myInvitations.filter(function (i) { return i.id !== id; });
                        _renderInvitations();
                        _updateInvBadge();
                    })
                    .catch(function (err) { toast(err.detail || 'Error', 'error'); });
            }
        });
    }

    // ── Init ───────────────────────────────────────────────────────────────────

    function _bindDangerZone() {
        var toggleBtn = document.getElementById('btn-ws-toggle-status');
        var deleteBtn = document.getElementById('btn-ws-delete');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', function () {
                if (!_currentWs) return;
                var isDisabled = _currentWs.status === 'disabled';
                var newStatus = isDisabled ? 'active' : 'disabled';
                if (!isDisabled && !confirm('¿Desactivar "' + _currentWs.name + '"? Sus miembros no podrán acceder al contenido compartido con este grupo hasta que lo reactives.')) return;
                toggleBtn.disabled = true;
                api.post('/api/workspaces/' + _currentWs.id + '/status', { status: newStatus })
                    .then(function () {
                        _currentWs.status = newStatus;
                        toast(isDisabled ? 'Grupo reactivado' : 'Grupo desactivado', 'success');
                        _renderDangerZone();
                        load();
                    })
                    .catch(function (err) { toast(err.detail || err.message || 'Error', 'error'); })
                    .finally(function () { toggleBtn.disabled = false; });
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', function () {
                if (!_currentWs) return;
                if (!confirm('¿Eliminar "' + _currentWs.name + '"? Se borrará todo su contenido (agentes, skills, conocimiento, conexiones) — los recursos originales de otros dueños que hayan sido enlazados aquí no se ven afectados. Esta acción no se puede deshacer.')) return;
                deleteBtn.disabled = true;
                api.del('/api/workspaces/' + _currentWs.id)
                    .then(function () {
                        toast('Grupo eliminado', 'success');
                        _closeModal();
                        load();
                    })
                    .catch(function (err) { toast(err.detail || err.message || 'Error', 'error'); })
                    .finally(function () { deleteBtn.disabled = false; });
            });
        }
    }

    // ── Abandonar workspace ──────────────────────────────────────────────────────

    function _leaveDirectly() {
        if (!_currentWs || !_me) return;
        if (!confirm('¿Abandonar "' + _currentWs.name + '"? Dejarás de tener acceso a su contenido.')) return;
        api.del('/api/workspaces/' + _currentWs.id + '/members/' + encodeURIComponent(_me))
            .then(function () {
                toast('Has abandonado el grupo', 'success');
                _closeModal();
                load();
            })
            .catch(function (err) { toast(err.detail || err.message || 'Error', 'error'); });
    }

    function _openLeaveOwnerModal() {
        if (!_currentWs || !_me) return;
        var others = _currentMembers.filter(function (m) { return m.username !== _me; });

        if (!others.length) {
            if (!confirm('Eres el único miembro de "' + _currentWs.name + '". Al abandonarlo, el grupo se eliminará. Los recursos originales de cada dueño no se ven afectados. ¿Continuar?')) return;
            api.del('/api/workspaces/' + _currentWs.id)
                .then(function () {
                    toast('Grupo eliminado', 'success');
                    _closeModal();
                    load();
                })
                .catch(function (err) { toast(err.detail || err.message || 'Error', 'error'); });
            return;
        }

        var select = document.getElementById('ws-leave-owner-select');
        if (select) {
            select.innerHTML = others.map(function (m) {
                return '<option value="' + esc(m.username) + '">' + esc(m.display_name || m.username) + '</option>';
            }).join('');
        }
        document.getElementById('modal-ws-leave-owner').style.display = '';
    }

    function _bindLeaveZone() {
        var leaveBtn = document.getElementById('btn-ws-leave');
        if (leaveBtn) leaveBtn.addEventListener('click', _leaveDirectly);

        var leaveOwnerBtn = document.getElementById('btn-ws-leave-owner');
        if (leaveOwnerBtn) leaveOwnerBtn.addEventListener('click', _openLeaveOwnerModal);

        var modal = document.getElementById('modal-ws-leave-owner');
        var closeIt = function () { if (modal) modal.style.display = 'none'; };
        var closeBtn = document.getElementById('btn-ws-leave-owner-close');
        var cancelBtn = document.getElementById('btn-ws-leave-owner-cancel');
        if (closeBtn) closeBtn.addEventListener('click', closeIt);
        if (cancelBtn) cancelBtn.addEventListener('click', closeIt);
        if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeIt(); });

        var confirmBtn = document.getElementById('btn-ws-leave-owner-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function () {
                if (!_currentWs || !_me) return;
                var select = document.getElementById('ws-leave-owner-select');
                var newOwner = select ? select.value : '';
                if (!newOwner) return;
                confirmBtn.disabled = true;
                api.post('/api/workspaces/' + _currentWs.id + '/transfer-ownership', { username: newOwner })
                    .then(function () {
                        return api.del('/api/workspaces/' + _currentWs.id + '/members/' + encodeURIComponent(_me));
                    })
                    .then(function () {
                        toast('Propiedad transferida — has abandonado el grupo', 'success');
                        closeIt();
                        _closeModal();
                        load();
                    })
                    .catch(function (err) { toast(err.detail || err.message || 'Error', 'error'); })
                    .finally(function () { confirmBtn.disabled = false; });
            });
        }
    }

    function init() {
        _bindTabs();
        _bindInviteBtn();
        _bindDangerZone();
        _bindLeaveZone();

        var closeBtn = document.getElementById('btn-ws-members-close');
        if (closeBtn) { closeBtn.addEventListener('click', _closeModal); }
        var modalBg = document.getElementById('modal-ws-members');
        if (modalBg) {
            modalBg.addEventListener('click', function (e) {
                if (e.target === modalBg) { _closeModal(); }
            });
        }

        var navBtn = document.getElementById('nav-workspaces');
        if (navBtn) {
            navBtn.addEventListener('click', function () { load(); });
        }

        var newWsBtn = document.getElementById('btn-new-workspace');
        if (newWsBtn && window.WorkspaceCreateWizard) {
            newWsBtn.addEventListener('click', function () {
                WorkspaceCreateWizard.open(load);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', init);
}());

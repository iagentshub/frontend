// profile-billing.js — gestión de suscripción Stripe (tab Suscripción del perfil)
(function () {
    'use strict';

    var freeBlock = document.getElementById('billing-free-block');
    var activeBlock = document.getElementById('billing-active-block');
    var tierEl = document.getElementById('billing-tier');
    var statusEl = document.getElementById('billing-status');
    var renewalEl = document.getElementById('billing-renewal');
    var seatsBlock = document.getElementById('billing-seats-block');
    var seatsInput = document.getElementById('billing-seats-input');
    var changeSeatsBtn = document.getElementById('btn-change-seats');
    var cancelBtn = document.getElementById('btn-cancel-sub');
    var reactivateBtn = document.getElementById('btn-reactivate-sub');

    var _TIER_LABELS = { developer: 'Individual', business: 'Business', free: 'Free' };
    var _STATUS_LABELS = {
        active: 'Activa', trialing: 'En prueba', past_due: 'Pago pendiente',
        incomplete: 'Incompleta', canceled: 'Cancelada',
    };

    function fmtDate(iso) {
        if (!iso) return '—';
        var d = new Date(iso);
        return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function render(state) {
        if (state.tier === 'free') {
            freeBlock.hidden = false;
            activeBlock.hidden = true;
            return;
        }
        freeBlock.hidden = true;
        activeBlock.hidden = false;

        tierEl.textContent = _TIER_LABELS[state.tier] || state.tier;
        statusEl.textContent = (_STATUS_LABELS[state.status] || state.status) +
            (state.cancel_at_period_end ? ' (se cancela al final del periodo)' : '');
        renewalEl.textContent = fmtDate(state.current_period_end);

        if (state.tier === 'business') {
            seatsBlock.hidden = false;
            seatsInput.value = state.seats;
        } else {
            seatsBlock.hidden = true;
        }

        cancelBtn.hidden = state.cancel_at_period_end || state.status === 'canceled';
        reactivateBtn.hidden = !state.cancel_at_period_end;
    }

    async function load() {
        try {
            var state = await window.api.get('/api/billing/subscription');
            render(state);
        } catch (e) {
            // Silencioso — el tab de facturación no bloquea el resto del perfil
        }
    }

    changeSeatsBtn.addEventListener('click', async function () {
        var seats = parseInt(seatsInput.value, 10);
        if (!seats || seats < 2 || seats > 100) {
            window.toast && window.toast('Introduce un número de asientos entre 2 y 100', 'error');
            return;
        }
        changeSeatsBtn.disabled = true;
        try {
            await window.api.post('/api/billing/change-seats', { seats: seats });
            window.toast && window.toast('Asientos actualizados', 'success');
            await load();
        } catch (e) {
            window.toast && window.toast(e.message || 'No se pudo actualizar', 'error');
        } finally {
            changeSeatsBtn.disabled = false;
        }
    });

    cancelBtn.addEventListener('click', async function () {
        cancelBtn.disabled = true;
        try {
            await window.api.post('/api/billing/cancel', { immediate: false });
            window.toast && window.toast('Suscripción programada para cancelarse', 'success');
            await load();
        } catch (e) {
            window.toast && window.toast(e.message || 'No se pudo cancelar', 'error');
        } finally {
            cancelBtn.disabled = false;
        }
    });

    reactivateBtn.addEventListener('click', async function () {
        reactivateBtn.disabled = true;
        try {
            await window.api.post('/api/billing/reactivate');
            window.toast && window.toast('Suscripción reactivada', 'success');
            await load();
        } catch (e) {
            window.toast && window.toast(e.message || 'No se pudo reactivar', 'error');
        } finally {
            reactivateBtn.disabled = false;
        }
    });

    // Deep link /profile/?section=billing (usado tras completar un checkout)
    var wantedSection = new URLSearchParams(window.location.search).get('section');
    if (wantedSection === 'billing') {
        document.querySelectorAll('.profile-section').forEach(function (sec) {
            sec.hidden = sec.id !== 'section-billing';
        });
        document.querySelectorAll('.profile-nav-item').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.section === 'section-billing');
        });
    }

    load();
}());

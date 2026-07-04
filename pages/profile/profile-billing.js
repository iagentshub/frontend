// profile-billing.js — sección Suscripción del perfil
(function () {
    'use strict';

    // ── Precios (espejo de billing_pricing.py y pricing.js) ────────────────
    var DEV_PRICE  = 9;
    var BIZ_START  = 7.50;
    var FLOOR      = DEV_PRICE * 0.50;   // 4.50
    var ENT_THR    = 100;
    var MONTHS_ANN = 10;
    var SLOPE      = (BIZ_START - FLOOR) / (ENT_THR - 1);

    function ppl(n) {
        if (n <= 0) return 0;
        if (n === 1) return DEV_PRICE;
        return Math.max(FLOOR, BIZ_START - SLOPE * (n - 1));
    }

    function fmt(num) {
        var r = Math.round(num * 100) / 100;
        return '€' + (r % 1 === 0 ? r.toFixed(0) : r.toFixed(2).replace('.', ','));
    }

    function fmtDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // ── Estado ─────────────────────────────────────────────────────────────
    var _currentTier  = 'free';
    var _selectedTier = null;
    var _seats        = 1;
    var _annual       = false;

    // ── Planes (nombres y precios de la página de pricing) ────────────────
    var PLANS = [
        {
            id: 'free', name: 'Novato',
            priceLabel: function () { return 'Gratis'; },
            desc: 'Cuenta gratuita con acceso a grupos. Sin coste.',
            multiSeat: false,
        },
        {
            id: 'developer', name: 'Soldado',
            priceLabel: function (annual) {
                return annual
                    ? fmt(DEV_PRICE * MONTHS_ANN) + '/año'
                    : fmt(DEV_PRICE) + '/mes';
            },
            desc: 'Uso personal · 1 licencia intransferible · backups · soporte directo.',
            multiSeat: false,
        },
        {
            id: 'business', name: 'Tropa',
            priceLabel: function (annual, seats) {
                var s   = Math.max(2, seats || 2);
                var pps = ppl(s);
                var m   = pps * s;
                return annual
                    ? fmt(m * MONTHS_ANN) + '/año'
                    : 'desde ' + fmt(pps) + '/lic/mes';
            },
            desc: 'Equipos hasta 100 personas · panel admin · onboarding.',
            multiSeat: true,
        },
    ];

    // ── DOM refs ───────────────────────────────────────────────────────────
    var grid          = document.getElementById('billing-plans-grid');
    var descEl        = document.getElementById('billing-desc');
    var activeInfo    = document.getElementById('billing-active-info');
    var statusEl      = document.getElementById('billing-status');
    var renewalEl     = document.getElementById('billing-renewal');
    var upgradeRow    = document.getElementById('billing-upgrade-row');
    var upgradeBtn    = document.getElementById('btn-upgrade-plan');
    var cancelSelBtn  = document.getElementById('btn-billing-cancel-sel');
    var seatsBlock    = document.getElementById('billing-seats-block');
    var seatsInput    = document.getElementById('billing-seats-input');
    var changeSeatsBtn = document.getElementById('btn-change-seats');
    var cancelBtn     = document.getElementById('btn-cancel-sub');
    var reactivateBtn = document.getElementById('btn-reactivate-sub');

    // ── Render tarjetas ────────────────────────────────────────────────────
    function renderPlans() {
        if (!grid) return;
        grid.innerHTML = PLANS.map(function (p) {
            var isCurrent  = p.id === _currentTier;
            var isSelected = p.id === _selectedTier;
            var price = p.priceLabel(_annual, p.id === 'business' ? _seats : 1);
            return '<div class="billing-plan-card' +
                (isCurrent  ? ' billing-plan-card--current'  : '') +
                (isSelected ? ' billing-plan-card--selected' : '') +
                '" data-plan="' + p.id + '">' +
                (isCurrent ? '<span class="billing-plan-badge">Tu plan</span>' : '') +
                '<div class="billing-plan-name">' + p.name + '</div>' +
                '<div class="billing-plan-price">' + price + '</div>' +
                '<p class="billing-plan-desc">' + p.desc + '</p>' +
                '</div>';
        }).join('');

        // Intervalo mensual/anual
        var wrap = document.getElementById('billing-interval-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'billing-interval-wrap';
            grid.parentNode.insertBefore(wrap, grid.nextSibling);
        }
        var hasPaid = _selectedTier && _selectedTier !== 'free';
        wrap.innerHTML = hasPaid
            ? '<div class="billing-interval-toggle">' +
              '<button class="billing-int-btn' + (!_annual ? ' active' : '') + '" id="billing-int-monthly">Mensual</button>' +
              '<button class="billing-int-btn' + (_annual  ? ' active' : '') + '" id="billing-int-annual">Anual <span class="billing-int-save">2 meses gratis</span></button>' +
              '</div>' : '';

        bindPlanCards();
        var mBtn = document.getElementById('billing-int-monthly');
        var aBtn = document.getElementById('billing-int-annual');
        if (mBtn) mBtn.onclick = function () { _annual = false; renderPlans(); };
        if (aBtn) aBtn.onclick = function () { _annual = true;  renderPlans(); };
    }

    function bindPlanCards() {
        if (!grid) return;
        grid.querySelectorAll('.billing-plan-card').forEach(function (card) {
            card.onclick = function () {
                var plan = card.dataset.plan;
                _selectedTier = (plan === _currentTier) ? null : plan;
                if (_selectedTier === 'developer') _seats = 1;
                if (_selectedTier === 'business' && _seats < 2) _seats = 2;
                updateUpgradeUI();
                renderPlans();
            };
        });
    }

    function updateUpgradeUI() {
        var hasSel = _selectedTier && _selectedTier !== _currentTier;
        upgradeRow.style.display = hasSel ? '' : 'none';
        var showSeats = _selectedTier === 'business' || (_currentTier === 'business' && !_selectedTier);
        seatsBlock.style.display = showSeats ? '' : 'none';
        if (showSeats && seatsInput) seatsInput.value = _seats;
        if (upgradeBtn && hasSel) {
            var plan = PLANS.find(function (p) { return p.id === _selectedTier; });
            upgradeBtn.textContent = 'Actualizar a ' + (plan ? plan.name : _selectedTier);
        }
    }

    // ── Actualizar plan ────────────────────────────────────────────────────
    if (upgradeBtn) {
        upgradeBtn.onclick = async function () {
            upgradeBtn.disabled = true;
            upgradeBtn.textContent = 'Procesando…';
            try {
                var seats = _selectedTier === 'business'
                    ? Math.max(2, parseInt(seatsInput ? seatsInput.value : '2', 10))
                    : 1;
                if (_selectedTier === 'free') {
                    await window.api.post('/api/billing/cancel', { immediate: false });
                    window.toast && window.toast('Suscripción cancelada al final del periodo', 'success');
                } else {
                    await window.api.post('/api/billing/subscribe', {
                        tier: _selectedTier, seats: seats,
                        interval: _annual ? 'year' : 'month', self_hosted: false,
                    });
                    window.toast && window.toast('Plan actualizado correctamente', 'success');
                }
                _selectedTier = null;
                await load();
            } catch (e) {
                window.toast && window.toast(e.message || 'No se pudo cambiar el plan', 'error');
            } finally {
                upgradeBtn.disabled = false;
                updateUpgradeUI();
            }
        };
    }

    if (cancelSelBtn) {
        cancelSelBtn.onclick = function () { _selectedTier = null; updateUpgradeUI(); renderPlans(); };
    }

    // ── Asientos activos ───────────────────────────────────────────────────
    if (seatsInput) {
        seatsInput.oninput = function () { _seats = parseInt(seatsInput.value, 10) || 2; renderPlans(); };
    }

    if (changeSeatsBtn) {
        changeSeatsBtn.onclick = async function () {
            var seats = parseInt(seatsInput.value, 10);
            if (!seats || seats < 2 || seats > 100) {
                window.toast && window.toast('Entre 2 y 100 licencias', 'error'); return;
            }
            changeSeatsBtn.disabled = true;
            try {
                await window.api.post('/api/billing/change-seats', { seats: seats });
                window.toast && window.toast('Licencias actualizadas', 'success');
                await load();
            } catch (e) { window.toast && window.toast(e.message || 'Error', 'error'); }
            finally { changeSeatsBtn.disabled = false; }
        };
    }

    // ── Cancelar / Reactivar ───────────────────────────────────────────────
    var STATUS_LABELS = {
        active: 'Activa', trialing: 'En prueba', past_due: 'Pago pendiente',
        incomplete: 'Incompleta', canceled: 'Cancelada',
    };

    if (cancelBtn) {
        cancelBtn.onclick = async function () {
            if (!confirm('¿Cancelar suscripción? Seguirá activa hasta el fin del periodo de facturación.')) return;
            cancelBtn.disabled = true;
            try {
                await window.api.post('/api/billing/cancel', { immediate: false });
                window.toast && window.toast('Cancelación programada', 'success');
                await load();
            } catch (e) { window.toast && window.toast(e.message || 'Error', 'error'); }
            finally { cancelBtn.disabled = false; }
        };
    }

    if (reactivateBtn) {
        reactivateBtn.onclick = async function () {
            reactivateBtn.disabled = true;
            try {
                await window.api.post('/api/billing/reactivate');
                window.toast && window.toast('Suscripción reactivada', 'success');
                await load();
            } catch (e) { window.toast && window.toast(e.message || 'Error', 'error'); }
            finally { reactivateBtn.disabled = false; }
        };
    }

    // ── Carga del estado ───────────────────────────────────────────────────
    async function load() {
        try {
            var state = await window.api.get('/api/billing/subscription');
            _currentTier = state.tier || 'free';
            _seats = state.seats || (_currentTier === 'business' ? 2 : 1);
            _selectedTier = null;

            if (descEl) descEl.textContent = _currentTier === 'free'
                ? 'Selecciona un plan para contratar el servicio gestionado.'
                : 'Gestiona tu suscripción activa.';

            if (state.status && _currentTier !== 'free') {
                activeInfo.style.display = '';
                statusEl.textContent = (STATUS_LABELS[state.status] || state.status) +
                    (state.cancel_at_period_end ? ' (se cancela al final del periodo)' : '');
                renewalEl.textContent = fmtDate(state.current_period_end);
            } else {
                activeInfo.style.display = 'none';
            }

            cancelBtn.style.display     = (!state.cancel_at_period_end && _currentTier !== 'free') ? '' : 'none';
            reactivateBtn.style.display = state.cancel_at_period_end ? '' : 'none';
            upgradeRow.style.display    = 'none';
            seatsBlock.style.display    = _currentTier === 'business' ? '' : 'none';
            if (_currentTier === 'business' && seatsInput) seatsInput.value = _seats;
        } catch (_) {
            _currentTier = 'free';
            if (descEl) descEl.textContent = 'Selecciona un plan para contratar el servicio gestionado.';
            activeInfo.style.display = 'none';
            upgradeRow.style.display = 'none';
            seatsBlock.style.display = 'none';
        }
        renderPlans();
    }

    window.initBilling = load;
    load();
}());

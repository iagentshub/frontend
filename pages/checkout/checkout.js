'use strict';

(function () {
    var VALID_TIERS = { developer: 1, business: 1 };

    function qs(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function fmtEuros(cents) {
        return '€' + (cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function showError(msg) {
        var el = document.getElementById('co-error');
        el.textContent = msg;
        el.hidden = false;
    }

    function stripeAppearance() {
        var s = getComputedStyle(document.documentElement);
        return {
            theme: 'night',
            variables: {
                colorPrimary: s.getPropertyValue('--accent').trim() || '#FF3B30',
                colorBackground: s.getPropertyValue('--surface-2').trim() || '#1C1C1C',
                colorText: s.getPropertyValue('--ink').trim() || '#F2F2F2',
                colorDanger: s.getPropertyValue('--danger').trim() || '#FF453A',
                fontFamily: 'Inter, "Segoe UI", system-ui, sans-serif',
                borderRadius: (s.getPropertyValue('--radius').trim() || '10px'),
            },
        };
    }

    async function main() {
        // Auth check — preserva la URL de checkout para volver tras login
        var me = await fetch((window.API_BASE || '') + '/api/auth/me').catch(function () { return null; });
        if (!me || !me.ok) {
            window.location.replace('/login/?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
            return;
        }

        var tier = qs('tier') || '';
        var seats = parseInt(qs('seats') || '0', 10);
        var interval = qs('interval') === 'year' ? 'year' : 'month';
        var selfHosted = qs('selfHosted') === 'true' || qs('selfHosted') === '1';

        if (!VALID_TIERS[tier] || !seats || seats < 1) {
            window.location.replace('/pricing/');
            return;
        }
        if (tier === 'developer' && seats !== 1) {
            window.location.replace('/pricing/');
            return;
        }
        if (tier === 'business' && (seats < 2 || seats > 100)) {
            window.location.replace('/pricing/');
            return;
        }

        var planNameEl = document.getElementById('co-plan-name');
        var planSeatsEl = document.getElementById('co-plan-seats');
        var totalEl = document.getElementById('co-total');
        var intervalLabelEl = document.getElementById('co-interval-label');
        var submitBtn = document.getElementById('co-submit');
        var submitLabel = document.getElementById('co-submit-label');

        planNameEl.textContent = tier === 'developer' ? 'Individual' : 'Business';
        planSeatsEl.textContent = tier === 'business' ? (seats + ' licencias') : '1 licencia';
        intervalLabelEl.textContent = interval === 'year' ? '/ año' : '/ mes';

        var quote;
        try {
            quote = await window.api.post('/api/billing/quote', { tier: tier, seats: seats, interval: interval, self_hosted: selfHosted });
        } catch (e) {
            showError(e.message || 'No se pudo calcular el precio');
            return;
        }
        totalEl.textContent = fmtEuros(quote.amount_cents);

        if (!window.STRIPE_PUBLISHABLE_KEY) {
            showError('Stripe no está configurado en este entorno.');
            return;
        }
        var stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);

        var subscribeResp;
        try {
            subscribeResp = await window.api.post('/api/billing/subscribe', { tier: tier, seats: seats, interval: interval, self_hosted: selfHosted });
        } catch (e) {
            showError(e.message || 'No se pudo iniciar la suscripción');
            return;
        }

        sessionStorage.setItem('co_subscription_id', subscribeResp.subscription_id);

        var elements = stripe.elements({ clientSecret: subscribeResp.client_secret, appearance: stripeAppearance() });
        var paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');

        submitBtn.disabled = false;
        submitLabel.textContent = 'Suscribirse por ' + fmtEuros(quote.amount_cents);

        document.getElementById('co-form').addEventListener('submit', async function (e) {
            e.preventDefault();
            submitBtn.disabled = true;
            submitLabel.textContent = 'Procesando…';
            document.getElementById('co-error').hidden = true;

            var result = await stripe.confirmPayment({
                elements: elements,
                confirmParams: {
                    return_url: window.location.origin + '/checkout/?tier=' + tier + '&seats=' + seats + '&interval=' + interval + '&complete=1',
                },
                redirect: 'if_required',
            });

            if (result.error) {
                showError(result.error.message || 'El pago no se pudo completar');
                submitBtn.disabled = false;
                submitLabel.textContent = 'Suscribirse por ' + fmtEuros(quote.amount_cents);
                return;
            }

            await _confirmAndRedirect();
        });

        // Vuelta desde un redirect de Stripe (3DS, métodos que lo requieren)
        if (qs('complete') === '1') {
            await _confirmAndRedirect();
        }
    }

    async function _confirmAndRedirect() {
        var subscriptionId = sessionStorage.getItem('co_subscription_id');
        if (!subscriptionId) return;
        try {
            await window.api.post('/api/billing/confirm', { subscription_id: subscriptionId });
        } catch (e) {
            // El webhook reconciliará el estado igualmente
        }
        sessionStorage.removeItem('co_subscription_id');
        document.getElementById('co-form').hidden = true;
        document.getElementById('co-success').hidden = false;
        setTimeout(function () {
            window.location.href = '/profile/?section=billing';
        }, 1500);
    }

    main();
}());

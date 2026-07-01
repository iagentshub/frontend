// config.template.js — plantilla procesada por docker-entrypoint.sh (envsubst)
// para generar assets/js/config.js con los valores reales del contenedor.
'use strict';
window.API_BASE = window.API_BASE || '${API_BASE}';
window.STRIPE_PUBLISHABLE_KEY = window.STRIPE_PUBLISHABLE_KEY || '${STRIPE_PUBLISHABLE_KEY}';

// config.js — URL base de la API y claves públicas
// En desarrollo con backend en el mismo origen: dejar vacío.
// En producción con backend separado: window.API_BASE = 'http://tu-backend:8765';
// Este archivo es sobreescrito en el contenedor Docker por docker-entrypoint.sh
// (a partir de config.template.js) — aquí queda el fallback para dev sin Docker.
'use strict';
window.API_BASE = window.API_BASE || '';
window.STRIPE_PUBLISHABLE_KEY = window.STRIPE_PUBLISHABLE_KEY || '';

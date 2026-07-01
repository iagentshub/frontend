#!/bin/sh
set -e

: "${API_BASE:=}"
: "${STRIPE_PUBLISHABLE_KEY:=}"

envsubst '${API_BASE} ${STRIPE_PUBLISHABLE_KEY}' \
    < /usr/share/nginx/html/assets/js/config.template.js \
    > /usr/share/nginx/html/assets/js/config.js

exec nginx -g 'daemon off;'

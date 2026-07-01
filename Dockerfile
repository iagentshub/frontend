FROM nginx:alpine

# gettext aporta envsubst, usado por docker-entrypoint.sh para inyectar
# API_BASE / STRIPE_PUBLISHABLE_KEY en config.js al arrancar el contenedor
RUN apk add --no-cache gettext

# Eliminar páginas por defecto de nginx para que el fallback funcione correctamente
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html

# Copiar ficheros estáticos del frontend
COPY . /usr/share/nginx/html

# Configuración de nginx (sobreescribe la de default.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]

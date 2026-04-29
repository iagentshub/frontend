FROM nginx:alpine

# Eliminar páginas por defecto de nginx para que el fallback funcione correctamente
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html

# Copiar ficheros estáticos del frontend
COPY . /usr/share/nginx/html

# Configuración de nginx (sobreescribe la de default.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

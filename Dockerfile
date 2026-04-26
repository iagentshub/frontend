FROM nginx:alpine

# Copiar ficheros estáticos del frontend
COPY . /usr/share/nginx/html

# Configuración de nginx (sobreescribe la de default.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

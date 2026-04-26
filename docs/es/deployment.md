<div align="center">
  <a href="index.md">← Índice</a> &nbsp;·&nbsp;
  <a href="../en/deployment.md">🇬🇧 Read in English</a>
</div>

<br>

# Despliegue

---

## Docker (independiente)

El Dockerfile copia todos los ficheros estáticos en la imagen nginx y reemplaza la configuración por defecto:

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Construir y ejecutar de forma independiente:

```bash
docker build -t iagentshub-frontend .
docker run -p 80:80 iagentshub-frontend
```

> En modo independiente, el destino del proxy `/api/` (`http://backend:8765`) no resolverá a menos que también ejecutes el backend por separado y configures la red. Usa el stack de iAgentsHub para la configuración completa.

---

## Vía iAgentsHub (recomendado)

Este servicio está diseñado para desplegarse como parte del stack de [iagentshub](https://github.com/iagentshub/iagentshub), que conecta todos los servicios automáticamente:

```bash
docker compose up --build
```

El hostname `backend` en `nginx.conf` es resuelto por el DNS interno de Docker dentro de la red de Compose — no se necesita configuración de red manual.

---

## Desarrollo local (sin Docker)

Para iteración rápida sin Docker, sirve los ficheros estáticos directamente con cualquier servidor HTTP:

```bash
# Python
python3 -m http.server 3000

# Node.js (npx)
npx serve . -l 3000
```

Las llamadas a la API fallarán hasta que configures un proxy inverso local que apunte `/api/` a una instancia del backend en ejecución.

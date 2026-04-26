<div align="center">
  <a href="index.md">← Index</a> &nbsp;·&nbsp;
  <a href="../es/deployment.md">🇪🇸 Ver en Español</a>
</div>

<br>

# Deployment

---

## Docker (standalone)

The Dockerfile copies all static files into the nginx image and replaces the default nginx config:

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Build and run standalone:

```bash
docker build -t iagentshub-frontend .
docker run -p 80:80 iagentshub-frontend
```

> In standalone mode the `/api/` proxy target (`http://backend:8765`) won't resolve unless you also run the backend separately and configure networking. Use the iAgentsHub stack for the full setup.

---

## Via iAgentsHub (recommended)

This service is designed to be deployed as part of the [iagentshub](https://github.com/iagentshub/iagentshub) stack, which wires all services together automatically:

```bash
docker compose up --build
```

The `backend` hostname in `nginx.conf` is resolved by Docker's internal DNS within the Compose network — no manual networking configuration required.

---

## Local development (no Docker)

For quick iteration without Docker, serve the static files directly with any HTTP server:

```bash
# Python
python3 -m http.server 3000

# Node.js (npx)
npx serve . -l 3000
```

API calls will fail until you configure a local reverse proxy pointing `/api/` to a running backend instance.

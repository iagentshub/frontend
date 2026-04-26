<div align="center">
  <a href="docs/en/index.md">🇬🇧 Read in English</a> &nbsp;·&nbsp;
  <a href="docs/es/index.md">🇪🇸 Ver en Español</a>
</div>

<br>

<div align="center">
  <img src="https://img.shields.io/badge/nginx-alpine-009639?style=flat-square&logo=nginx&logoColor=white" alt="nginx">
  <img src="https://img.shields.io/badge/Vanilla_JS-no_bundler-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="License">
</div>

<br>

<h1 align="center">iAgentsHub — Frontend</h1>

<p align="center">Static web interface for iAgentsHub. Built with vanilla JavaScript and HTML — no build step, no bundler. Served by nginx, which also proxies <code>/api/</code> requests to the backend.</p>

---

## Pages

| Page | Path | Description |
|---|---|---|
| **Chat** | `/` | Main agent chat interface with SSE streaming |
| **Agents** | `/agents/` | Create and configure agents, attach skills |
| **Connections** | `/connections/` | Manage API keys for AI providers |
| **Memory** | `/memory/` | View and edit per-agent memory |
| **Skills** | `/skills/` | Browse available skills |
| **Profile** | `/profile/` | User settings |
| **Admin** | `/admin/` | User management (admin role required) |
| **Login** | `/login/` | Authentication |
| **Register** | `/register/` | Create a new account |

---

## Structure

```
assets/
  css/            ← shared stylesheets
  js/             ← shared utilities
  components/     ← reusable UI components
agents/           ← agents page JS modules
connections/      ← connections page JS modules
memory/           ← memory page JS modules
skills/           ← skills page JS
profile/          ← profile page JS
login/
  index.html
index.html        ← chat page (app entry point)
nginx.conf        ← nginx configuration
Dockerfile
```

Each page is a standalone HTML file. JavaScript is split into small, focused modules loaded in order via `<script>` tags — no module bundler required.

---

## nginx

The included `nginx.conf` handles two responsibilities:

**Reverse proxy** — routes `/api/` to the backend service:
```nginx
location /api/ {
    proxy_pass http://backend:8765;
    proxy_buffering off;      # required for SSE streaming
    proxy_cache off;
    chunked_transfer_encoding on;
}
```

**Static files** — serves the app with HTML5 history fallback:
```nginx
location / {
    try_files $uri $uri/ $uri/index.html =404;
}
```

Because the frontend and API share the same origin through nginx, no CORS configuration is needed in the browser.

---

## Getting Started

### Local (development)

Open `index.html` directly in a browser, or serve with any static file server. For API calls to work, the backend must be running and accessible.

```bash
# Quick static server (Python)
python -m http.server 3000
```

### Docker

```bash
docker build -t iagentshub-frontend .
docker run -p 80:80 iagentshub-frontend
```

### Via iAgentsHub (recommended)

This service is designed to be deployed as part of the [iagentshub](https://github.com/iagentshub/iagentshub) stack:

```bash
docker compose up -d --build
```

The stack automatically resolves the `backend` hostname used in `nginx.conf`.

---

## Documentation

| | English | Español |
|---|---|---|
| Full docs | [docs/en/index.md](docs/en/index.md) | [docs/es/index.md](docs/es/index.md) |

---

## License

[MIT](LICENSE)
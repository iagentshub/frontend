<div align="center">
  <a href="index.md">← Index</a> &nbsp;·&nbsp;
  <a href="../es/architecture.md">🇪🇸 Ver en Español</a>
</div>

<br>

# Architecture

The frontend is a collection of static HTML pages served by nginx. There is no build step, no bundler, and no framework — just HTML, CSS, and JavaScript loaded in the browser.

Each page is self-contained. Shared state and utilities are loaded as global scripts in a defined order before page-specific modules.

```
Browser → nginx → static files
              ↓
         /api/* → backend:8765 (reverse proxy)
```

Because nginx proxies the API under the same origin, the browser never makes cross-origin requests. No CORS configuration is needed on the client side.

---

## Code Structure

```
assets/
  css/            ← shared stylesheets
  js/             ← shared utilities (api, auth, toast, theme…)
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

---

## Design Decisions

- **No build step** — every JS file is loaded directly by the browser. No transpilation, bundling or minification pipeline is needed.
- **Global script order** — shared utilities (`config.js`, `api.js`, `auth.js`, etc.) are loaded before page modules in a deterministic `<script>` order.
- **Same-origin API** — nginx proxies `/api/` to the backend on the same origin, avoiding CORS entirely.
- **SSE streaming** — the chat page uses `fetch` with a `ReadableStream` to consume the backend's `text/event-stream` response without a library.

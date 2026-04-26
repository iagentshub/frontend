<div align="center">
  <a href="index.md">← Index</a> &nbsp;·&nbsp;
  <a href="../es/nginx.md">🇪🇸 Ver en Español</a>
</div>

<br>

# nginx

The included `nginx.conf` handles two responsibilities: routing API requests to the backend and serving static files with HTML5 history fallback.

---

## Reverse proxy

All requests to `/api/` are forwarded to the backend container. SSE streaming requires disabling buffering:

```nginx
location /api/ {
    proxy_pass http://backend:8765;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding on;
}
```

> `proxy_buffering off` is required for Server-Sent Events (SSE). Without it, nginx would buffer the stream and the chat UI would not receive chunks in real time.

---

## Static files

The app uses HTML5 history-style navigation. The `try_files` directive ensures deep links resolve correctly:

```nginx
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ $uri/index.html =404;
}
```

This means a direct visit to `/agents/` serves `agents/index.html`, and any unknown path correctly returns 404.

---

## Same-origin benefit

Because nginx proxies the API under the same origin as the frontend, the browser never makes cross-origin requests. No CORS configuration is needed on the client side and no preflight requests are issued.

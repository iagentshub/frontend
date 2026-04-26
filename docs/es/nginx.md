<div align="center">
  <a href="index.md">← Índice</a> &nbsp;·&nbsp;
  <a href="../en/nginx.md">🇬🇧 Read in English</a>
</div>

<br>

# nginx

El `nginx.conf` incluido tiene dos responsabilidades: enrutar las peticiones API al backend y servir los ficheros estáticos con fallback de historial HTML5.

---

## Proxy inverso

Todas las peticiones a `/api/` se reenvían al contenedor backend. El streaming SSE requiere desactivar el buffering:

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

> `proxy_buffering off` es necesario para Server-Sent Events (SSE). Sin esto, nginx almacenaría en buffer el stream y la UI del chat no recibiría los chunks en tiempo real.

---

## Ficheros estáticos

La app usa navegación estilo HTML5 history. La directiva `try_files` asegura que los enlaces directos resuelvan correctamente:

```nginx
location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ $uri/index.html =404;
}
```

Esto significa que una visita directa a `/agents/` sirve `agents/index.html`, y cualquier ruta desconocida devuelve correctamente un 404.

---

## Ventaja del mismo origen

Como nginx proxifica la API bajo el mismo origen que el frontend, el navegador nunca realiza peticiones entre orígenes distintos. No se necesita configuración CORS en el cliente y no se emiten peticiones preflight.

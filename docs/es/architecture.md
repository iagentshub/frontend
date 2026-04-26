<div align="center">
  <a href="index.md">← Índice</a> &nbsp;·&nbsp;
  <a href="../en/architecture.md">🇬🇧 Read in English</a>
</div>

<br>

# Arquitectura

El frontend es una colección de páginas HTML estáticas servidas por nginx. No hay paso de compilación, ni bundler, ni framework — solo HTML, CSS y JavaScript cargados en el navegador.

Cada página es autocontenida. El estado compartido y las utilidades se cargan como scripts globales en un orden definido antes que los módulos de cada página.

```
Navegador → nginx → ficheros estáticos
               ↓
          /api/* → backend:8765 (proxy inverso)
```

Como nginx proxifica la API bajo el mismo origen, el navegador nunca realiza peticiones entre orígenes distintos. No se necesita configuración CORS en el cliente.

---

## Estructura del código

```
assets/
  css/            ← hojas de estilo compartidas
  js/             ← utilidades compartidas (api, auth, toast, theme…)
  components/     ← componentes UI reutilizables
agents/           ← módulos JS de la página agentes
connections/      ← módulos JS de la página conexiones
memory/           ← módulos JS de la página memoria
skills/           ← JS de la página skills
profile/          ← JS de la página perfil
login/
  index.html
index.html        ← página de chat (punto de entrada de la app)
nginx.conf        ← configuración de nginx
Dockerfile
```

---

## Decisiones de diseño

- **Sin paso de compilación** — cada fichero JS es cargado directamente por el navegador. No se necesita pipeline de transpilación, bundling ni minificación.
- **Orden de scripts global** — las utilidades compartidas (`config.js`, `api.js`, `auth.js`, etc.) se cargan antes que los módulos de página en un orden determinista con `<script>`.
- **API en mismo origen** — nginx proxifica `/api/` al backend en el mismo origen, evitando CORS por completo.
- **Streaming SSE** — la página de chat usa `fetch` con un `ReadableStream` para consumir la respuesta `text/event-stream` del backend sin ninguna librería.

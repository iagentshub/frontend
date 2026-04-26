<div align="center">
  <a href="index.md">← Índice</a> &nbsp;·&nbsp;
  <a href="../en/api.md">🇬🇧 Read in English</a>
</div>

<br>

# Integración con la API

El frontend se comunica con el backend exclusivamente a través de los endpoints `/api/`. La autenticación usa **cookies HTTP-only** establecidas por el backend — no se necesita gestión de tokens en el cliente.

---

## Wrapper api.js

`assets/js/api.js` envuelve `fetch` y expone tres métodos en `window.api`:

| Método | Uso |
|---|---|
| `api.get(path)` | Petición `GET`, devuelve JSON parseado |
| `api.post(path, body)` | Petición `POST` con cuerpo JSON, devuelve JSON parseado |
| `api.del(path)` | Petición `DELETE`, devuelve JSON parseado |

Los errores lanzados por el wrapper incluyen una propiedad `.status` para que los módulos de página puedan reaccionar a códigos HTTP concretos:

```js
try {
    await api.del('/api/admin/users/john');
} catch (e) {
    if (e.status === 403) redirectHome();
    else toast(e.message, 'error');
}
```

---

## Autenticación

Todas las páginas protegidas llaman a `requireAuth()` (de `auth.js`) al cargar. Si no hay una cookie de sesión válida, el usuario es redirigido a `/login/`.

Las credenciales nunca se guardan en `localStorage` ni en variables JavaScript — el token de sesión es una cookie HTTP-only gestionada íntegramente por el navegador y el backend.

---

## SSE en el chat

La página de chat consume el endpoint de streaming usando `fetch` con un `ReadableStream`:

```js
const resp = await fetch(`/api/agents/${id}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
});
const reader = resp.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const event = JSON.parse(line.slice(6));
        if (event.type === 'chunk') appendToChat(event.content);
        if (event.type === 'done') finalize(event.reply);
    }
}
```

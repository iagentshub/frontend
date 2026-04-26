<div align="center">
  <a href="index.md">← Index</a> &nbsp;·&nbsp;
  <a href="../es/api.md">🇪🇸 Ver en Español</a>
</div>

<br>

# API Integration

The frontend communicates with the backend exclusively through `/api/` endpoints. Authentication uses **HTTP-only cookies** set by the backend — no token handling is needed in the client.

---

## api.js wrapper

`assets/js/api.js` wraps `fetch` and exposes three methods on `window.api`:

| Method | Usage |
|---|---|
| `api.get(path)` | `GET` request, returns parsed JSON |
| `api.post(path, body)` | `POST` request with JSON body, returns parsed JSON |
| `api.del(path)` | `DELETE` request, returns parsed JSON |

Errors thrown by the wrapper include a `.status` property so page modules can react to specific HTTP codes:

```js
try {
    await api.del('/api/admin/users/john');
} catch (e) {
    if (e.status === 403) redirectToHome();
    else toast(e.message, 'error');
}
```

---

## Authentication

All protected pages call `requireAuth()` (from `auth.js`) on load. If no valid session cookie is present, the user is redirected to `/login/`.

Credentials are never stored in `localStorage` or JavaScript variables — the session token is an HTTP-only cookie managed entirely by the browser and backend.

---

## SSE Chat

The chat page consumes the streaming endpoint using `fetch` with a `ReadableStream`:

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

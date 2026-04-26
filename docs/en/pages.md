<div align="center">
  <a href="index.md">← Index</a> &nbsp;·&nbsp;
  <a href="../es/pages.md">🇪🇸 Ver en Español</a>
</div>

<br>

# Pages

| Page | Path | Entry point | Description |
|---|---|---|---|
| **Chat** | `/` | `index.html` | Main interface. Opens a conversation with any configured agent |
| **Agents** | `/agents/` | `agents/index.html` | Create, configure, and manage agents. Attach skills and set the system prompt |
| **Connections** | `/connections/` | `connections/index.html` | Add and manage API keys for AI providers |
| **Memory** | `/memory/` | `memory/index.html` | Read and edit per-agent persistent memory |
| **Skills** | `/skills/` | `skills/index.html` | Browse available skills by language and category |
| **Profile** | `/profile/` | `profile/index.html` | User settings |
| **Admin** | `/admin/` | `admin/index.html` | User management — list and delete accounts (admin role required) |
| **Login** | `/login/` | `login/index.html` | Authentication |
| **Register** | `/register/` | `register/index.html` | Create a new account |

---

## Adding a New Page

1. Create a directory: `my-page/`
2. Add `my-page/index.html` — copy the structure from an existing page
3. Add `my-page/my-page.js` for page-specific logic
4. Load shared scripts before the page module in `<head>`

nginx will serve it automatically at `/my-page/` with no additional configuration.

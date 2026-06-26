<div align="center">
  <a href="index.md">← Index</a> &nbsp;·&nbsp;
  <a href="../es/pages.md">🇪🇸 Ver en Español</a>
</div>

<br>

# Pages

The platform is organized into sections accessible from the main navigation.

---

| Section | Description |
|---|---|
| **Login** | Sign-in screen with email and password form. Accessible at `/login/`. Includes a guest access button and a link to the registration page. |
| **Register** | Two-step new account registration: step 1 (email + password) and step 2 (optional profile: birth date, gender, country, phone). Username is auto-generated from the email. Accessible at `/register/`. |
| **Dashboard** | Customizable platform overview. The grid uses 4 columns; each panel has three selectable sizes: **Small** (1 column, 25%), **Medium** (2 columns, 50%), and **Large** (4 columns, 100%). The size not only changes the panel width — it also adapts the rendered content: **Summary** shows a compact vertical list / cards without icon / full cards with SVG icon and link; **Token usage** shows only the total / top 3 / top N with enriched legend; **Activity** shows a hero number + mini bars / 14-day histogram / full configurable histogram; **Connection status** shows a hero counter / compact list / paginated card grid; **Recent agents** shows a name list / 2-column grid / full paginated grid. The **Connection status** and **Recent agents** widgets include client-side pagination with ← X/N → controls in the footer. The **Customize** button enters edit mode: panels can be reordered by dragging, added from the side panel, and removed with the × button. Each panel has a gear icon that flips the card to reveal its configuration options; the size selector is visual (proportional bar at 25%/50%/100%) and the remaining options use chip-style pills. Layout and per-panel config are persisted per user. Accessible at `/dashboard/`. |
| **Chat** | Main interface. Opens a conversation with any configured agent. |
| **Agents** | Create, configure, and manage agents. Define their instructions, assign skills, and set up **Routines** — named tasks each with a trigger (manual, scheduled, or webhook) and a prompt that describes what the agent should do when run. Includes a **Catalog** button to browse and fork public agents, and a **Load** button to import agents from files exported by Claude, GitHub Copilot, OpenAI, or iAgentshub itself. |
| **Connections** | Add and manage connections to AI providers. For providers like Ollama, each installed model appears as a separate selectable entry for agents. Each card shows the total tokens consumed through that connection; hovering reveals the breakdown between input and output tokens. |
| **Memory** | View and edit each agent's persistent memory. Includes a **Load** button to import `.md` or `.json` files from disk — the filename becomes the memory file name. |
| **Knowledge** | Knowledge management for attaching context to agents. Organized in three tabs: **Skills** (browse available skills with a Load button to import a private JSON), **Webs** (save web pages whose text is extracted when added), and **Documents** (upload `.txt`, `.md`, or `.pdf` files with drag & drop support). Each item's content is injected in full into the agent's system prompt at chat start. Accessible at `/knowledge/`. Private resources (skills, webs, documents) can be shared with groups via the share button; shared resources display a **Shared** badge in indigo. |
| **Profile** | User settings: visual theme and password. Includes a **Providers** tab to manage base credentials for each AI provider (API keys, Ollama host, etc.) and a **Groups** tab (within the workspace modal) to create collaboration groups and manage their members. Private resources are shared with groups from each respective section. Guests cannot create or join groups. |
| **Administration** | System control panel. Accessible to administrators only. Includes sections for **General** (statistics), **Users**, **Groups** (view and delete groups; inspect members and shared content), **Agents**, **Connections**, **Knowledge**, and **Logs**. |

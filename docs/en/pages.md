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
| **Chat** | Main interface. Opens a conversation with any configured agent. |
| **Agents** | Create, configure, and manage agents. Define their instructions, assign skills, and set up **Routines** — named tasks each with a trigger (manual, scheduled, or webhook) and a prompt that describes what the agent should do when run. Includes a **Catalog** button to browse and fork public agents, and a **Load** button to import agents from files exported by Claude, GitHub Copilot, OpenAI, or iAgentshub itself. |
| **Connections** | Add and manage API keys for AI providers. Each card shows the total tokens consumed through that connection; hovering reveals the breakdown between input and output tokens. |
| **Memory** | View and edit each agent's persistent memory. Includes a **Load** button to import `.md` or `.json` files from disk — the filename becomes the memory file name. |
| **Knowledge** | Knowledge management for attaching context to agents. Organized in three tabs: **Skills** (browse available skills with a Load button to import a private JSON), **Webs** (save web pages whose text is extracted when added), and **Documents** (upload `.txt`, `.md`, or `.pdf` files with drag & drop support). Each item's content is injected in full into the agent's system prompt at chat start. Accessible at `/knowledge/`; `/skills/` redirects here via 301. |
| **Profile** | User settings: visual theme and password. |
| **Administration** | User account management. Accessible to administrators only. |

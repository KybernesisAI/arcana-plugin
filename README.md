# Arcana — persistent AI memory, everywhere

**Arcana** (by [Kybernesis](https://kybernesis.ai)) gives Claude a long-term memory that survives across conversations, devices, and tools: a persistent entity graph, timeline, fact store, and semantic search over everything you've told it. It's the cloud counterpart of the KyberAgent local brain — the same memory, reachable from Claude Code, Claude Desktop, claude.ai, and any MCP-aware client.

Once connected, you can just talk:

- *"Remember that Sarah from Notion owns the API integration."*
- *"What do we know about Project Alpha?"*
- *"What happened this week?"*

Authentication is **OAuth — there are no API keys to copy** for normal use. The first time a client connects, your browser opens, you sign in, and you pick which workspace to bind. That's it.

---

## Install

### Claude Code (CLI and desktop app)

**1. Add the marketplace** (one-time):

```
/plugin marketplace add KybernesisAI/arcana-plugin
```

**2. Install the plugin:**

```
/plugin install arcana@arcana-plugin
```

**3. Authenticate:**

```
/mcp
```

Select **arcana** → **Authenticate**. A browser window opens: sign in at `arcana.kybernesis.ai`, approve the connection, and choose the workspace this machine should use. The workspace choice is bound to your token server-side — nothing else to configure.

**4. Verify:**

```
/arcana-setup
```

This checks the connection by calling `kybernesis_validate` and reports which workspace you're connected to.

From the shell instead of inside a session, steps 1–3 are:

```bash
claude plugin marketplace add KybernesisAI/arcana-plugin
claude plugin install arcana@arcana-plugin   # add --scope project to share via .claude/settings.json
claude mcp login arcana                      # opens the browser sign-in (or use /mcp in-session)
```

> **Note:** plugins run in local and SSH Claude Code sessions; cloud sessions don't load plugins.

### Claude Desktop (chat app)

Claude Desktop doesn't run Claude Code plugins, but it speaks the same MCP protocol — connect it directly:

1. Open **Settings → Connectors** and click **+** (**Add custom connector**). Free plans include one custom connector; Pro and above are unlimited.
2. Name: `Arcana` — URL: `https://mcp.arcana.kybernesis.ai/mcp`
3. Click **Add**, then **Connect**. The same browser sign-in + workspace picker appears.

You get all the memory tools (see below). The three bundled skills are Claude Code-only; in Desktop, just ask naturally ("remember this…", "what do you know about…") and Claude will use the tools.

### claude.ai (web)

Same idea as Desktop: **Customize → Connectors → + (Add custom connector)** with URL `https://mcp.arcana.kybernesis.ai/mcp`, then **Connect** and complete the browser sign-in.

### Headless / CI (advanced)

Machines that can't open a browser have two supported paths:

**Option A — API key + bundled stdio proxy.** Create a key at [arcana.kybernesis.ai/settings/api-keys](https://arcana.kybernesis.ai/settings/api-keys) (it's bound to one workspace), then run the proxy this repo ships at `bin/mcp-proxy.mjs` as a stdio MCP server:

```jsonc
// e.g. in a Claude Code project .mcp.json
{
  "mcpServers": {
    "arcana": {
      "command": "node",
      "args": ["/path/to/arcana-plugin/bin/mcp-proxy.mjs"],
      "env": {
        "ARCANA_API_KEY": "kb_live_…",
        "ARCANA_WORKSPACE": "your-workspace-slug"
      }
    }
  }
}
```

The proxy also reads `~/.arcana/api-key` + `~/.arcana/workspace` files (chmod 600) if the env vars aren't set.

**Option B — OAuth device flow (RFC 8628).** Clients that support it can POST to `https://mcp.arcana.kybernesis.ai/oauth/device_authorization` and have the user approve at the verification URL. No long-lived key on the box.

Raw HTTP also works with a key: send `Authorization: Bearer kb_live_…` **and** `X-Kyberagent-Agent: <workspace-slug>` on every request to the MCP endpoint.

---

## What you get

### Skills (Claude Code)

| Skill | Fires when | Does |
|---|---|---|
| `arcana-remember` | you state facts, decisions, people, deadlines, preferences | stores to timeline + entity graph + fact store + embeddings |
| `arcana-recall` | you ask about a person, project, company, topic, or the past | entity recall, hybrid semantic search, timeline queries |
| `arcana-brain-note` | you share long-form knowledge (decisions, research, meeting notes) | writes a readable `brain/*.md` note **and** indexes it |

### Command

- `/arcana-setup` — checks/repairs the connection and walks through authentication.

### MCP tools

Canonical tool names keep the `kybernesis_` prefix (a stable wire contract shared with KyberAgent local):

`kybernesis_remember`, `kybernesis_recall`, `kybernesis_search`, `kybernesis_timeline`, `kybernesis_brain_query`, `kybernesis_brain_add`, `kybernesis_brain_list`, `kybernesis_brain_read`, `kybernesis_brain_write`, `kybernesis_brain_stats`, `kybernesis_pin_entity`, `kybernesis_unpin_entity`, `kybernesis_list_workspaces`, `kybernesis_validate`

Deprecated v1 aliases (`kybernesis_add_memory`, `kybernesis_search_memory`, `kybernesis_list_memories`, `kybernesis_get_stats`) keep working during the 90-day migration window.

---

## How auth works

- The MCP server (`mcp.arcana.kybernesis.ai`) implements OAuth 2.1 with dynamic client registration, PKCE, refresh tokens, and the device grant. Clients discover everything from `/.well-known/oauth-authorization-server`.
- During sign-in you pick a **workspace**; that choice is bound to your access token server-side. One connection = one workspace. To switch workspaces, re-authenticate and pick a different one.
- Access tokens live 24h and refresh silently for up to 90 days. If refresh lapses (long-unused machine), the client just re-runs the browser flow.
- API keys (`kb_live_…`) exist for headless use only. Treat them like passwords; revoke them at [settings/api-keys](https://arcana.kybernesis.ai/settings/api-keys).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Tools error with "unauthorized" / 401 | Re-authenticate: `/mcp` → arcana → Authenticate (Code) or Connectors → Connect (Desktop/web). |
| "token has no workspace binding" | Re-run the sign-in and select a workspace on the consent page. |
| Connected but wrong workspace | Re-authenticate and pick the right one — the workspace is per-token. |
| Headless proxy says "credentials not found" | Set `ARCANA_API_KEY` + `ARCANA_WORKSPACE`, or write `~/.arcana/api-key` + `~/.arcana/workspace`. Legacy `KYBERNESIS_*` / `~/.kybernesis/` still work. |
| Old v1 plugin still installed | It keeps working through the 90-day alias window, but install `arcana` to get skills, OAuth, and the current tool surface. |

## KyberAgent parity

Arcana is 1:1 with the KyberAgent local brain: same tool semantics, same fact categories, same retrieval pipeline. An agent flipped between `memory_backend: local` and `cloud` sees the same behavior, and KyberAgent CLI/daemon installs talk to the same workspaces you connect here.

## License

MIT © Kybernesis

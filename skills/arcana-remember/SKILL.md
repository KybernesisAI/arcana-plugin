---
name: arcana-remember
description: "Persist important information from this conversation to long-term memory. Use proactively whenever the user mentions a person, project, company, decision, meeting, deadline, preference, or any fact that future sessions should know about. Also use when the user says remember this, store this, note this, keep track of, or don't forget."
allowed-tools: mcp__arcana__kybernesis_remember
---

# Remember

Stores information into the workspace brain's full memory pipeline — the same pipeline used by KyberAgent local for terminal, Telegram, WhatsApp, and heartbeat. Without this skill, conversations vanish when the session ends.

The `kybernesis_remember` MCP tool feeds the same `storeConversation()` pipeline as messaging channels:
- **Timeline** — temporal event index
- **Entity Graph** — people, companies, projects, and their relationships
- **Fact Store** — structured facts with categories, confidence, and temporal expiry
- **Embeddings** — semantic search (1536-dim text-embedding-3-small)

## When to Fire

Fire this skill **proactively** — don't wait for the user to say "remember this." If they mention a person, a decision, a project update, a preference, or any fact that future sessions would benefit from knowing — store it.

**Always store when:**
- The user mentions a new person and their role/relationship
- A decision is made about a project, tool, or approach
- Meeting notes or conversation summaries come up
- The user shares facts about themselves, their work, or their goals
- Deadlines, milestones, or schedule changes are discussed
- New projects or initiatives are mentioned

**Don't store:**
- Trivial back-and-forth ("thanks", "ok", "got it")
- Purely mechanical requests ("format this code", "fix the typo")
- Information already stored in this session

## How to Store

### Step 1: Compose the Memory

Summarize the key information in a clear, factual sentence. Include names, dates, and context. The text should be understandable out of context — a future session reading this should immediately grasp what happened.

Good: "Met with Sarah Chen from Notion on Feb 23 to discuss API integration for the dashboard project"
Bad: "Had a meeting about stuff"

### Step 2: Call the Tool

Call `kybernesis_remember` with at minimum `text`. Include `response` if there's a natural pair (e.g. user prompt + system reply). The `channel` parameter defaults to `chat` (confidence 0.85). For direct user statements in a terminal-shell-style flow, set `channel: 'terminal'` (confidence 0.95).

### Step 2b: Tag the Memory (when context is clear)

When the user's message tells you the memory belongs to a specific project, has obvious sensitivity, or is cross-cutting, **tag it**. ARP scope policies use these tags as the source of truth for what gets shared with paired peer agents.

| Field | When to set | Example |
|---|---|---|
| `project` | The memory is specifically about a named project, product, or initiative | `"alpha"`, `"kyberco-launch"` |
| `tags` | Cross-cutting themes or client/team names that aren't the primary project | `["launch", "draft"]` |
| `classification` | Content is sensitive | `"pii"` (SSNs, addresses, health), `"confidential"` (internal-only), `"internal"` (default for company info), `"public"` |

Pick **slugs** for `project` (lowercase, dashes/underscores). "Project Alpha" → `alpha`. "Q2 Launch" → `q2-launch`.

**Don't make up tags.** Only set `project` / `tags` when the user has clearly named a project or theme.

### Step 3: Confirm

Briefly acknowledge to the user that the information has been stored. A simple "Noted." or "Stored." suffices unless the user explicitly asked you to remember something, in which case confirm what you stored.

## Examples

**Person mentioned (no project context):** User says "I talked to Jake from the infra team about migrating to Kubernetes"
```
kybernesis_remember({
  text: "Talked to Jake from the infra team about migrating to Kubernetes"
})
```

**Decision in a named project:** User says "For project alpha, let's go with Next.js for the frontend"
```
kybernesis_remember({
  text: "Decision: using Next.js for the frontend",
  response: "Chosen over Remix and SvelteKit",
  project: "alpha"
})
```

**Meeting notes scoped to a project:**
```
kybernesis_remember({
  text: "Weekly sync with product team — discussed Q2 roadmap, prioritized auth overhaul and dashboard redesign",
  response: "Auth overhaul starts March 1, dashboard redesign in April. Sarah leading auth, Mike on dashboard.",
  project: "q2-launch",
  tags: ["roadmap"]
})
```

**Sensitive content:**
```
kybernesis_remember({
  text: "Acme Corp contract: $250K/year, auto-renews 2027-01-01",
  project: "acme-deal",
  classification: "confidential"
})
```

**PII (highest sensitivity tier):**
```
kybernesis_remember({
  text: "Sarah's home address is 123 Maple St",
  classification: "pii"
})
```

## Correction Detection

When the user says things like:
- "That's wrong about [entity]"
- "Actually, [entity] works at [X], not [Y]"
- "No, [correct fact]"
- "Forget that about [entity]"
- "[Entity] doesn't work at [X] anymore"

Treat this as a correction:

1. Call `kybernesis_recall` with the entity name to see what's currently known
2. Store the **correct** fact with `kybernesis_remember` — the contradiction detection system will automatically supersede the old, lower-confidence fact
3. Confirm briefly: "Corrected."

The memory system uses source confidence weighting — corrections stored from a terminal-style direct interaction get 0.95 confidence, which is higher than chat (0.85) or AI-extracted (0.60). A correction will naturally take precedence.

If the user says something is wrong but doesn't provide a replacement, acknowledge the issue and ask what the correct information is.

## Notes

- Memories are searchable via the `arcana-recall` skill (which covers entity recall, semantic search, and the timeline).
- This skill complements (not replaces) updating SOUL.md / USER.md / HEARTBEAT.md / brain notes. Use the `arcana-brain-note` skill for long-form documents. Use `remember` for the event/fact stream.

---
name: kybernesis-memory
description: >
  Save, search, and recall memories from the user's Kybernesis knowledge base.
  Trigger when the user says "remember this", "save this", "note this down",
  "store this for later", "add this to my memory", "what do you know about",
  "what have I told you about", "do you remember", "recall", "search my memories",
  "what do you know about me", "show my memories", "list what you know",
  "forget this", "delete memory", "remove this memory", "memory stats",
  "how many memories do I have", "sync my connectors", "connect Google Drive",
  "connect Notion", or any request to save, retrieve, search, or manage
  persistent knowledge across conversations.
  DO NOT TRIGGER for general knowledge questions that don't reference the user's
  personal memories or saved information.
---

# Kybernesis Memory

You have access to the user's **Kybernesis memory workspace** — a persistent knowledge base that survives across conversations. Use the Kybernesis MCP tools to save, search, and manage their memories.

## Available Tools

You have these MCP tools from the `kybernesis` server:

| Tool | When to use |
|------|------------|
| `kybernesis_search_memory` | User asks about something they've saved, wants to recall info, or asks "what do you know about X" |
| `kybernesis_add_memory` | User wants to save/remember/store something |
| `kybernesis_list_memories` | User wants to browse all their memories |
| `kybernesis_delete_memory` | User explicitly asks to forget/remove a memory |
| `kybernesis_get_stats` | User asks about memory count, storage stats, or "how many memories" |
| `kybernesis_list_connectors` | User asks about connected services (Google Drive, Notion, etc.) |
| `kybernesis_sync_connector` | User wants to refresh/sync a connector |

## Core Behaviors

### Saving Memories

When the user says "remember this", "save this", "note this down", or similar:

1. Extract the key information to save
2. Generate a descriptive `title` (short, specific)
3. Generate relevant `tags` (2-5 tags that will help with future retrieval)
4. Call `kybernesis_add_memory` with `content`, `title`, `tags`, and `source: "chat"`
5. Confirm what was saved with the title and tags

**What to save as content**: Include the full context — not just the bare fact, but enough surrounding detail so the memory is useful when recalled later. If the user is discussing a project decision, save the reasoning too. If they share a preference, include why.

**Tag strategy**: Use lowercase, specific tags. Prefer concrete topics over abstract ones:
- Good: `["react", "performance", "lazy-loading"]`
- Avoid: `["important", "misc", "stuff"]`

### Searching / Recalling

When the user asks "what do you know about X", "do you remember", "recall", or similar:

1. Call `kybernesis_search_memory` with a clear query derived from what the user is asking about
2. Present results naturally — weave the information into your response rather than listing raw data
3. If multiple memories match, synthesize them into a coherent answer
4. Mention the source memories briefly so the user knows where the info came from

If no results are found, tell the user honestly and suggest they save relevant information for next time.

### "What do you know about me?"

This is a common request. Handle it by:

1. Call `kybernesis_get_stats` to understand the scope of their workspace
2. Call `kybernesis_search_memory` with a broad query like "user preferences background role"
3. Call `kybernesis_list_memories` with a small limit to see recent entries
4. Synthesize a profile from the results — their interests, projects, preferences, roles

### Listing Memories

When the user asks to "show my memories" or "list what you know":

1. Call `kybernesis_list_memories` (default limit of 20 is fine for browsing)
2. Present them in a scannable format with title, tags, and a brief summary
3. Mention the total count so they know how many more exist

### Deleting Memories

When the user says "forget this" or "delete that memory":

1. If they reference a specific memory, search for it first to confirm the right one
2. Confirm with the user before deleting: "I found [title]. Should I remove it?"
3. Call `kybernesis_delete_memory` with the memoryId
4. Confirm deletion

**Never delete without confirmation.**

### Connectors

When the user mentions syncing Google Drive, Notion, or other connected services:

1. Call `kybernesis_list_connectors` to see what's connected
2. If they want to sync, call `kybernesis_sync_connector` with the connector ID
3. If nothing is connected, direct them to https://kybernesis.ai/connectors to set up integrations

## Response Style

- **Be natural**: Don't say "searching your Kybernesis memory workspace." Just find the info and present it.
- **Synthesize**: When multiple memories match, combine them into a useful answer rather than listing them one by one.
- **Be transparent about sources**: Briefly reference where info came from ("Based on what you saved about...") so the user trusts the recall.
- **Proactive saving**: If the user shares something important during conversation (a decision, preference, or key fact) and it seems like something they'd want to recall later, suggest saving it: "Want me to remember that for next time?"

## Not Connected

If the MCP tools return errors about authentication or connection:

- **Claude Desktop**: The OAuth flow should start automatically when you first use a Kybernesis tool. If it doesn't, try removing and re-adding the plugin, then use any memory tool to trigger sign-in.
- **Claude Code / Cowork**: Run `/kybernesis-setup` to authenticate with an API key.
- **Manual setup**: Visit https://kybernesis.ai/settings to get an API key and set the `KYBERNESIS_API_KEY` environment variable.

Tell the user which option applies to their environment.

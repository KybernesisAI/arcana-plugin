---
description: Connect your Arcana cloud brain workspace (OAuth sign-in) and verify the connection.
allowed-tools: Bash(curl:*), mcp__arcana__kybernesis_validate, AskUserQuestion
---

# Arcana Setup

Arcana authenticates with **OAuth — no API keys to copy**. Claude discovers the sign-in flow automatically from the MCP server.

## Steps

### 1. Check whether the connection already works

Call the `kybernesis_validate` MCP tool (no arguments).

- If it returns `ok: true` with a workspace, tell the user they're connected and to which workspace. Done.
- If the tool call fails with an authentication error, or the `arcana` MCP server shows as disconnected / needs authentication, continue.

### 2. Authenticate

Tell the user, based on where they're running:

- **Claude Code (CLI)**: run `/mcp`, select **arcana**, and choose **Authenticate**. A browser window opens — sign in and pick the workspace to connect. Then return here.
- **Claude Desktop**: open **Settings → Connectors**, find **arcana**, and click **Connect** — the same browser sign-in and workspace picker appears.

The browser flow is: sign in to arcana.kybernesis.ai → approve the connection → choose which workspace this client should use. The workspace choice is bound to the token server-side; nothing else to configure.

### 3. Verify

Call `kybernesis_validate` again. If it returns `ok: true`, tell the user:

- They're connected to Arcana and which workspace
- They can now say things like "remember this", "what do you know about X", "search my memories"
- Their memories persist across all conversations and tools
- KyberAgent local + any MCP-aware tool sees the same brain

If it still fails, ask them to re-run the authenticate step and check they picked the right workspace on the consent page.

## Headless / CI (advanced)

Machines that can't open a browser can use an API key instead: create one at **https://arcana.kybernesis.ai/settings/api-keys**, then run the bundled stdio proxy (`bin/mcp-proxy.mjs`) with `ARCANA_API_KEY` and `ARCANA_WORKSPACE` set (or `~/.arcana/api-key` + `~/.arcana/workspace` files). Headless devices can also use the OAuth device flow (`/oauth/device_authorization`) if the client supports it.

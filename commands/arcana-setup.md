---
description: Set up Arcana authentication. Run this first to connect your cloud brain workspace.
allowed-tools: Bash(mkdir:*), Bash(echo:*), Bash(chmod:*), Bash(cat:*), Bash(curl:*), Bash(test:*), AskUserQuestion
---

# Arcana Setup

Help the user connect their Arcana cloud brain workspace.

## Steps

### 1. Check for existing credentials

```bash
test -f ~/.arcana/api-key && echo "ARCANA_KEY_FOUND" || echo "NO_ARCANA_KEY"
test -f ~/.arcana/workspace && echo "ARCANA_WORKSPACE_FOUND" || echo "NO_ARCANA_WORKSPACE"
test -f ~/.kybernesis/api-key && echo "LEGACY_KEY_FOUND" || echo "NO_LEGACY_KEY"
test -f ~/.kybernesis/workspace && echo "LEGACY_WORKSPACE_FOUND" || echo "NO_LEGACY_WORKSPACE"
```

If `~/.arcana/` has both files, verify they work:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://api.arcana.kybernesis.ai/brain/$(cat ~/.arcana/workspace)/stats" \
  -H "Authorization: Bearer $(cat ~/.arcana/api-key)" \
  -H "X-Kyberagent-Agent: $(cat ~/.arcana/workspace)"
```

If the response is `200`, tell the user they're already connected.

If only the legacy `~/.kybernesis/` files exist and pass the same check (substituting the paths), tell the user their legacy credentials still work — the proxy reads them as a fallback — and offer to copy them to `~/.arcana/` for the new layout:

```bash
mkdir -p ~/.arcana
cat ~/.kybernesis/api-key > ~/.arcana/api-key
cat ~/.kybernesis/workspace > ~/.arcana/workspace
chmod 600 ~/.arcana/api-key ~/.arcana/workspace
```

Otherwise, continue.

### 2. Get the API key + workspace slug

Ask the user with AskUserQuestion:

> To connect Arcana, you need an API key and a workspace slug:
>
> 1. Go to **https://arcana.kybernesis.ai/settings/api-keys** (sign in if needed)
> 2. Pick the workspace you want to connect to and note its slug (e.g. `my-brain`)
> 3. Click **Create New Key** and copy the key (starts with `kb_`)
>
> Paste your API key:
> Paste your workspace slug:

### 3. Save them

```bash
mkdir -p ~/.arcana
echo "THE_API_KEY" > ~/.arcana/api-key
echo "THE_WORKSPACE_SLUG" > ~/.arcana/workspace
chmod 600 ~/.arcana/api-key ~/.arcana/workspace
```

Replace `THE_API_KEY` and `THE_WORKSPACE_SLUG` with what the user provided. No quotes.

### 4. Verify

```bash
curl -s "https://api.arcana.kybernesis.ai/brain/$(cat ~/.arcana/workspace)/stats" \
  -H "Authorization: Bearer $(cat ~/.arcana/api-key)" \
  -H "X-Kyberagent-Agent: $(cat ~/.arcana/workspace)"
```

If successful, tell the user:
- They're connected to Arcana
- They can now say things like "remember this", "what do you know about X", "search my memories"
- Their memories persist across all conversations and tools
- KyberAgent local + any MCP-aware tool will see the same brain
- They should restart the session (or reconnect MCP) so the proxy picks up the new credentials

If it fails, ask them to double-check both values and try again.

### Note for legacy v1 users

If the user has an old `kb_*` key from the original kybernesis.ai console, it keeps working for 90 days via backcompat aliases. The new tools (`kybernesis_remember`, `kybernesis_recall`, etc.) work alongside the old ones (`kybernesis_add_memory`, etc.) during this window.

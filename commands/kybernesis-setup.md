---
description: Set up Kybernesis (Arcana) authentication. Run this first to connect your cloud brain workspace.
allowed-tools: Bash(mkdir:*), Bash(echo:*), Bash(chmod:*), Bash(cat:*), Bash(curl:*), Bash(test:*), AskUserQuestion
---

# Kybernesis Setup

Help the user connect their Arcana cloud brain workspace.

## Steps

### 1. Check for existing credentials

```bash
test -f ~/.kybernesis/api-key && echo "EXISTING_KEY_FOUND" || echo "NO_KEY_FOUND"
test -f ~/.kybernesis/workspace && echo "EXISTING_WORKSPACE_FOUND" || echo "NO_WORKSPACE_FOUND"
```

If both exist, verify they work:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://api.arcana.kybernesis.ai/health" \
  -H "Authorization: Bearer $(cat ~/.kybernesis/api-key)" \
  -H "X-Kyberagent-Agent: $(cat ~/.kybernesis/workspace)"
```

If the response is `200`, tell the user they're already connected.

If not, continue.

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
mkdir -p ~/.kybernesis
echo "THE_API_KEY" > ~/.kybernesis/api-key
echo "THE_WORKSPACE_SLUG" > ~/.kybernesis/workspace
chmod 600 ~/.kybernesis/api-key ~/.kybernesis/workspace
```

Replace `THE_API_KEY` and `THE_WORKSPACE_SLUG` with what the user provided. No quotes.

### 4. Verify

```bash
curl -s "https://api.arcana.kybernesis.ai/brain/$(cat ~/.kybernesis/workspace)/stats" \
  -H "Authorization: Bearer $(cat ~/.kybernesis/api-key)" \
  -H "X-Kyberagent-Agent: $(cat ~/.kybernesis/workspace)"
```

If successful, tell the user:
- They're connected to Arcana
- They can now say things like "remember this", "what do you know about X", "search my memories"
- Their memories persist across all conversations and tools
- KyberAgent local + any MCP-aware tool will see the same brain

If it fails, ask them to double-check both values and try again.

### Note for legacy v1 users

If the user has an old `kb_*` key from the original kybernesis.ai console, it keeps working for 90 days via backcompat aliases. The new tools (`kybernesis_remember`, `kybernesis_recall`, etc.) work alongside the old ones (`kybernesis_add_memory`, etc.) during this window.

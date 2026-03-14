---
description: Set up Kybernesis authentication. Run this first to connect your memory workspace.
allowed-tools: Bash(mkdir:*), Bash(echo:*), Bash(chmod:*), Bash(cat:*), Bash(curl:*), Bash(test:*), AskUserQuestion
---

# Kybernesis Setup

Help the user connect their Kybernesis memory workspace.

## Steps

### 1. Check for existing credentials

```bash
test -f ~/.kybernesis/api-key && echo "EXISTING_KEY_FOUND" || echo "NO_KEY_FOUND"
```

If a key already exists, verify it works:

```bash
curl -s -o /dev/null -w "%{http_code}" "https://api.kybernesis.ai/v1/user/validate" \
  -H "Authorization: Bearer $(cat ~/.kybernesis/api-key)"
```

If the response is `200`, tell the user they're already connected and show their workspace info:

```bash
curl -s "https://api.kybernesis.ai/v1/user/validate" \
  -H "Authorization: Bearer $(cat ~/.kybernesis/api-key)"
```

If `401` or no key found, continue to step 2.

### 2. Get the API key

Ask the user for their API key using AskUserQuestion:

> To connect Kybernesis, you need an API key:
>
> 1. Go to **https://kybernesis.ai/settings** (sign in if needed)
> 2. Under **API Keys**, click **Create New Key**
> 3. Copy the key (starts with `kb_`)
>
> Paste your API key below:

### 3. Save the key

```bash
mkdir -p ~/.kybernesis && echo "THE_API_KEY" > ~/.kybernesis/api-key && chmod 600 ~/.kybernesis/api-key
```

Replace `THE_API_KEY` with the actual key the user provided. Do NOT include quotes around the key in the echo command.

### 4. Verify the connection

```bash
curl -s "https://api.kybernesis.ai/v1/user/validate" \
  -H "Authorization: Bearer $(cat ~/.kybernesis/api-key)"
```

If successful, tell the user:
- They're connected to Kybernesis
- They can now say things like "remember this", "what do you know about X", or "search my memories"
- Their memories persist across all conversations

If it fails, ask them to double-check their API key and try again.

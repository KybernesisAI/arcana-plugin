---
name: kybernesis-recall
description: "Look up what is known about a person, project, company, place, or topic from the workspace brain. Use proactively whenever the user mentions someone by name, references a project or company, asks about past interactions, or says who is, what do we know about, tell me about, or recall."
allowed-tools: mcp__kybernesis__kybernesis_recall, mcp__kybernesis__kybernesis_timeline, mcp__kybernesis__kybernesis_search
---

# Recall — Primary Memory Retrieval

This is the **primary memory retrieval path**. The Arcana brain (entity graph, timeline, fact store, embeddings) is the authoritative knowledge store — richer and more complete than any auto-memory file. When the user asks about anything stored in memory, this skill is the correct way to retrieve it.

This is the read counterpart to `kybernesis-remember` — together they give the session full bidirectional memory.

## When to Fire

**ALWAYS** fire this skill when the user asks about or mentions any person, project, company, place, topic, past decision, history, or context. Do not skip it because some other memory source seems to have an answer — those are supplementary. This skill queries the entity graph, temporal timeline, and semantic embeddings, which contain far more detail.

Do not wait for the user to say "recall." If they mention a name or entity and you don't already have fresh context loaded in this session, look it up immediately.

**Always look up when:**
- The user mentions a person by name and you don't have recent context about them
- A project or company is discussed and you need background
- The user asks "what do we know about...", "who is...", "tell me about..."
- You're about to give advice and historical context would improve it
- A meeting or event is referenced and you need details
- The user asks about past decisions, conversations, or interactions
- Any question where memory, knowledge, or context is involved

**Don't look up:**
- Entities you already retrieved in this session
- Generic nouns that aren't specific entities ("the project" without a name)
- When the user is clearly giving you information, not asking for it

## How to Recall

### Step 1: Identify the Entity

Extract the person, project, company, or topic name from the conversation. Use the most specific form available (e.g., "Sarah Chen" not just "Sarah").

### Step 2: Query the Brain

Use the right tool for the question:

**For entity lookup** (people, companies, projects):
```
kybernesis_recall({ entity: "<entity name>" })
```
Returns markdown with entity details, mentions, related entities, and recent facts.

**For time-based context** (what happened recently):
```
kybernesis_timeline({ today: true })
kybernesis_timeline({ week: true })
kybernesis_timeline({ search: "<keywords>" })
```

**For semantic search** (broader knowledge — anything not tied to a single entity):
```
kybernesis_search({ query: "<query>" })
```
Returns markdown with hybrid (semantic + keyword + temporal + entity-graph) search results, ranked by Reciprocal Rank Fusion.

### Step 3: Use the Context

Weave the retrieved information naturally into your response. Don't dump raw output — synthesize it. If you found relevant history, reference it conversationally: "Last time you spoke with Sarah, you discussed the API integration..."

If nothing is found, don't mention the lookup. Just proceed without that context.

## Examples

**User mentions a person:** "I need to follow up with Jake"
```
kybernesis_recall({ entity: "Jake" })
```
Then weave it in: "Jake is on the infra team — last time you spoke, you discussed the Kubernetes migration. Want me to draft a follow-up about that?"

**User asks about a project:** "What's the status of the dashboard redesign?"
```
kybernesis_recall({ entity: "dashboard redesign" })
kybernesis_timeline({ search: "dashboard" })
```

**User references a past decision:** "Why did we go with PostgreSQL?"
```
kybernesis_recall({ entity: "PostgreSQL" })
kybernesis_search({ query: "PostgreSQL decision rationale" })
```

**User asks "what do you know about me?"** Combine multiple lookups:
1. `kybernesis_brain_stats({})` — scope of the workspace
2. `kybernesis_search({ query: "user preferences role background" })`
3. `kybernesis_timeline({ week: true })`
4. Synthesize a profile from the results.

## Notes

- Combine `recall` (entity graph) with `timeline` (temporal) and `search` (semantic) for the most complete picture.
- If recall returns multiple matches, use the most relevant one based on conversation context.
- After a conversation where new information surfaces, store it with `kybernesis-remember` so future `recall` queries find it.

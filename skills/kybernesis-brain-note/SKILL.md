---
name: kybernesis-brain-note
description: "Save long-form knowledge, research findings, architecture decisions, reference material, or structured notes to the workspace brain for persistent retrieval. Use when the user shares detailed information that doesn't fit a single memory, discusses architecture or design decisions, provides reference material, shares meeting notes or research, or says save this to the brain, write this down, document this, or take notes on."
allowed-tools: mcp__kybernesis__kybernesis_brain_add, mcp__kybernesis__kybernesis_remember
---

# Brain Note

Persists structured, long-form knowledge to the workspace's `brain/` directory and indexes it into the full pipeline. While `kybernesis-remember` captures individual facts and events into the timeline + entity graph + fact store, `kybernesis-brain-note` is for richer content that benefits from being a readable document — architecture decisions, research findings, meeting notes, reference material, project context.

## When to Fire

**Always write a brain note when:**
- The user shares or discusses an architecture or design decision with rationale
- Research findings or analysis results come up that should be referenced later
- Detailed meeting notes are shared (beyond what a single `remember` call captures)
- The user provides reference material, specs, or documentation to retain
- A complex topic is discussed that warrants a structured writeup
- Project context or onboarding information is shared
- The user explicitly asks to document or write something down

**Don't write a brain note for:**
- Single facts or events — use `kybernesis-remember` instead
- Information about the user — update USER.md instead (via the web console's living-docs editor)
- Information about the agent's identity — update SOUL.md instead

## How to Write

### Step 1: Compose the Content

Use clear markdown with dates and context. Every note should be understandable on its own — a future session reading it should immediately grasp the content without needing the original conversation.

Structure for **decisions**:
```markdown
## [Decision Title] — [Date]

**Context**: [Why this decision was needed]
**Decision**: [What was decided]
**Rationale**: [Why this option was chosen]
**Alternatives considered**: [What else was evaluated]
**Implications**: [What this means going forward]
```

Structure for **meeting notes**:
```markdown
## [Meeting Title] — [Date]

**Attendees**: [Who was there]
**Summary**: [Key points]
**Decisions**: [What was decided]
**Action items**: [What needs to happen next]
```

Structure for **research/reference**:
```markdown
## [Topic] — [Date]

[Findings, analysis, or reference material organized with clear headings]
```

### Step 2: Index It

Call `kybernesis_brain_add` with the full markdown content and a descriptive title. This runs the full pipeline: chunks the content → embeddings (1536-dim) → entity extraction → fact extraction → timeline event with `type: "note"`.

```
kybernesis_brain_add({
  content: "## Frontend Framework Choice — 2026-05-21\n\n**Context**: ...\n**Decision**: Next.js with App Router\n**Rationale**: ...",
  title: "Frontend framework choice — Next.js App Router",
  type: "note"
})
```

After indexing, also store a discoverable pointer with `kybernesis-remember` so future `recall` queries surface it:

```
kybernesis_remember({
  text: "Brain note: frontend framework decision — Next.js with App Router",
  response: "Full doc indexed at brain/architecture-decisions.md"
})
```

Both steps together ensure the content is searchable by meaning (semantic) AND discoverable in the timeline + entity graph.

### Step 3: Confirm

Tell the user the note was saved. Mention the title.

## Examples

**Architecture decision discussed:**
```
kybernesis_brain_add({
  content: "## Frontend Framework Choice — 2026-05-21\n\n**Context**: Needed to choose a framework for the new dashboard\n**Decision**: Next.js with App Router\n**Rationale**: SSR support, team familiarity, strong ecosystem\n**Alternatives considered**: Remix (less mature), SvelteKit (team unfamiliar)\n**Implications**: Lock into React ecosystem, need to learn App Router patterns",
  title: "Frontend framework — Next.js App Router",
  type: "note"
})
```

**Research findings shared:**
```
kybernesis_brain_add({
  content: "# Kubernetes Migration Research — 2026-05-21\n\n## Current State\nRunning on bare EC2 instances with manual deploys...\n\n## Findings\n...",
  title: "Kubernetes migration research",
  type: "note"
})
```

## Notes

- Brain notes are fully indexed: content is embedded for semantic search and a summary is stored in the timeline + entity graph.
- Notes are searchable via `kybernesis-search`, `kybernesis-recall`, and `kybernesis_brain_query`.
- Use `kybernesis-remember` for the event/fact stream, `kybernesis-brain-note` for the knowledge base. They complement each other.
- Keep notes focused. One topic per note is better than one giant note.
- Always include dates so future sessions know when information was captured.

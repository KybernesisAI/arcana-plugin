---
name: arcana-brain-note
description: "Save long-form knowledge, research findings, architecture decisions, reference material, or structured notes to the workspace brain for persistent retrieval. Use when the user shares detailed information that doesn't fit a single memory, discusses architecture or design decisions, provides reference material, shares meeting notes or research, or says save this to the brain, write this down, document this, or take notes on."
allowed-tools: mcp__arcana__kybernesis_brain_list, mcp__arcana__kybernesis_brain_read, mcp__arcana__kybernesis_brain_write, mcp__arcana__kybernesis_brain_add, mcp__arcana__kybernesis_remember
---

# Brain Note

Persists structured, long-form knowledge to the workspace's `brain/` directory as a readable markdown file AND indexes it into the full pipeline. While `arcana-remember` captures individual facts and events into the timeline + entity graph + fact store, `arcana-brain-note` is for richer content that benefits from being a readable document — architecture decisions, research findings, meeting notes, reference material, project context.

Both halves matter: the file (`kybernesis_brain_write`) is what shows up in `/brain/notes`, the web console, and the KyberAgent mirror; the index (`kybernesis_brain_add`) is what makes it discoverable via semantic search, entities, and the timeline. Doing only one leaves the note half-invisible.

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
- Single facts or events — use `arcana-remember` instead
- Information about the user — update USER.md instead (via the web console's living-docs editor)
- Information about the agent's identity — update SOUL.md instead

## How to Write

### Step 1: Choose the Right File

Organize brain notes by topic. Use descriptive filenames in kebab-case:

```
project-dashboard-redesign.md
architecture-decisions.md
meeting-notes-2026-07.md
reference-api-endpoints.md
```

Check what already exists before creating a new file:

```
kybernesis_brain_list({ source: "brain" })
```

If a relevant file already exists, **append** to it rather than creating a new one: read it with `kybernesis_brain_read({ name: "<filename>.md" })`, add your new section to the end, and write the combined content back.

### Step 2: Compose and Write the File

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

Write the file:

```
kybernesis_brain_write({
  name: "architecture-decisions.md",
  content: "## Frontend Framework Choice — 2026-05-21\n\n**Context**: ...\n**Decision**: Next.js with App Router\n**Rationale**: ..."
})
```

### Step 3: Index It

Call `kybernesis_brain_add` with the same markdown content, a descriptive title, and `source_path` pointing at the file you just wrote. This runs the full pipeline: chunks the content → embeddings (1536-dim) → entity extraction → fact extraction → timeline event with `type: "note"`. When appending to an existing file, index only the new section — not the whole file again.

```
kybernesis_brain_add({
  content: "## Frontend Framework Choice — 2026-05-21\n\n**Context**: ...\n**Decision**: Next.js with App Router\n**Rationale**: ...",
  title: "Frontend framework choice — Next.js App Router",
  type: "note",
  source_path: "brain/architecture-decisions.md"
})
```

Together the two steps ensure the content is a readable document in `brain/` AND searchable by meaning, entities, and time.

### Step 4: Confirm

Tell the user the note was saved. Mention the filename and title.

## Examples

**Architecture decision discussed:**
```
kybernesis_brain_write({
  name: "architecture-decisions.md",
  content: "## Frontend Framework Choice — 2026-05-21\n\n**Context**: Needed to choose a framework for the new dashboard\n**Decision**: Next.js with App Router\n**Rationale**: SSR support, team familiarity, strong ecosystem\n**Alternatives considered**: Remix (less mature), SvelteKit (team unfamiliar)\n**Implications**: Lock into React ecosystem, need to learn App Router patterns"
})
kybernesis_brain_add({
  content: "## Frontend Framework Choice — 2026-05-21\n\n**Context**: Needed to choose a framework for the new dashboard\n**Decision**: Next.js with App Router\n**Rationale**: SSR support, team familiarity, strong ecosystem\n**Alternatives considered**: Remix (less mature), SvelteKit (team unfamiliar)\n**Implications**: Lock into React ecosystem, need to learn App Router patterns",
  title: "Frontend framework — Next.js App Router",
  type: "note",
  source_path: "brain/architecture-decisions.md"
})
```

**Research findings shared:**
```
kybernesis_brain_write({
  name: "kubernetes-migration-research.md",
  content: "# Kubernetes Migration Research — 2026-05-21\n\n## Current State\nRunning on bare EC2 instances with manual deploys...\n\n## Findings\n..."
})
kybernesis_brain_add({
  content: "# Kubernetes Migration Research — 2026-05-21\n\n## Current State\nRunning on bare EC2 instances with manual deploys...\n\n## Findings\n...",
  title: "Kubernetes migration research",
  type: "note",
  source_path: "brain/kubernetes-migration-research.md"
})
```

## Notes

- Brain notes are BOTH a file in `brain/` (visible in `/brain/notes`, the web console, and the KyberAgent mirror) and fully indexed (embedded for semantic search, summarized into timeline + entity graph).
- Notes are searchable via the `arcana-recall` skill and `kybernesis_brain_query`, and readable via `kybernesis_brain_read`.
- Use `arcana-remember` for the event/fact stream, `arcana-brain-note` for the knowledge base. They complement each other.
- Keep notes focused. One topic per note is better than one giant note.
- Always include dates so future sessions know when information was captured.

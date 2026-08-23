---
id: US-006
title: Expose status JSON with requires, missingDeps, and unlocks
type: story
epic: EPIC-003
status: done
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [status, ops]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As an** agent or script,
**I want to** run `pb status <ID> --json`,
**So that** I know whether the item is ready, what it requires, and what it unlocks — including when it is not blocked.

## Acceptance criteria

- [x] Given any work item, when I run `pb status <ID> --json`, then the payload includes `state` (`ready` | `blocked` | `done` | `cancelled`), `requires` (every `depends_on` as `{ id, state }`, always an array), `missingDeps` (unmet local blockers only), and `unlocks` (one-hop reverse `depends_on` as `{ id, state, title }`)
- [x] Given a ready item, when I read `requires`, then the array is still present (possibly empty or all `done`) — never omitted
- [x] Given computed `state`, when frontmatter is `done` or `cancelled`, then `state` matches; otherwise `blocked` if any local `depends_on` is missing or not `done`/`cancelled`; otherwise `ready`. Frontmatter `in-progress` / `review` / `todo` / `backlog` can all be `ready`. Remote `repo#ID` refs appear in `requires` but do not block
- [x] Given several ready items, when `listReady(ctx)` lists them, then they are in topological `depends_on` order with declaration (index) order breaking ties. This is not `pb next` order (US-007). Optional: `pb status --json` with no ID returns `{ items: listReady() }`
- [x] Given CLI, MCP, and UI, when they ask for status, then they call the same ops function (`statusOf`). Keep `explain` as a separate human-facing surface

## Notes

Per-id `pb status <ID> --json` is this story. Keep `explain` (human notes, parent, children) separate — do not overload it.

Borrowed from OpenSpec `status --json`. OpenSpec issue #1212 shipped silently because `requires` was only exposed for blocked artifacts. Do not repeat that.

## Out of scope

Changing `pb next` ordering (US-007). Transitive unlocks beyond one hop can be a follow-up.

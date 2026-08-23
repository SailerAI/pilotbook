---
id: TASK-024
title: Roadmap tab
type: task
story: US-008
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: frontend
tags: [roadmap, ui]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 95a36b0135b4 }
---
## Scope

Add `{ id: "roadmap" }` beside Backlog/ADRs/Rules/Ideas; columns = phases + Unphased; epic swimlanes; stories/tasks nested via `schema.types[type].parent` (same as US-030). Data from existing `GET /api/items`. Independent of the board task.

## Steps

- [x] Add a Roadmap tab next to Backlog/ADRs/Rules/Ideas
- [x] Columns are phases ascending plus Unphased; epics as swimlanes; stories/tasks nested via `schema.types[type].parent`
- [x] Read `data.phase` from `/api/items`; do not recompute

## Verification

Opening the Roadmap tab groups items by phase with Unphased last. Nested children use schema parent, not hardcoded epic/story fields.

---
id: TASK-020
title: Order next by action ladder
type: task
story: US-007
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [next, ops]
depends_on: [TASK-018]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 25df25c9482f }
---
## Scope

Change `nextReady` to include unblocked `in-progress` → `review` → `todo`/`ready` → `backlog`; then existing `sortReady` (phase → priority → estimate → id); add `ladder` on each row; keep omitting blocked. Reuse `itemState` from TASK-018. CLI/MCP/`GET /api/next` already call `nextReady` — no UI task.

## Steps

- [x] Rank unblocked items by ladder: `resume` (`in-progress`) → `review` → `ready` (`todo`/`ready`) → `backlog`; omit blocked
- [x] After ladder, keep existing `sortReady` (phase → priority → estimate → id)
- [x] Add `ladder` (`resume` | `review` | `ready` | `backlog`) on each `--json` row
- [x] Tests for ladder order, tie-break, and blocked omission

## Verification

`pb next --json` prefers unblocked in-progress, then review, then ready, then backlog. Each row includes `ladder`. Blocked items stay omitted.

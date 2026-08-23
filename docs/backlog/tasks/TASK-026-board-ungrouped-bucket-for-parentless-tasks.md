---
id: TASK-026
title: Board Ungrouped bucket for parentless tasks
type: task
story: US-012
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [board, routing]
depends_on: [TASK-025]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 201faa7dbcda }
---
## Scope

Give `writeBoard` in `src/ops/items.ts` an `Ungrouped` bucket for tasks with no `story`, following the `## By phase` pattern from TASK-023: read `data.story`, do not synthesize a parent. Markdown generation only — no Vue or UI work in this task.

## Steps

- [x] Group tasks with an absent `story` under `Ungrouped` in `writeBoard`, rendered after the story-grouped sections
- [x] Never render a placeholder parent such as `US-000`; the bucket is omitted entirely when there are no parentless tasks
- [x] Test that regenerating `BOARD.md` includes the bucket with exactly the parentless tasks, and that it disappears when there are none

## Verification

`pnpm pb board` writes an `Ungrouped` section into `docs/backlog/BOARD.md` listing only the parentless tasks, and `pnpm pb lint` exits 0.

---
id: TASK-023
title: Board phase section
type: task
story: US-008
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [roadmap, board]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 53fd5c44f58c }
---
## Scope

Extend `writeBoard` in `src/ops/items.ts` with `## By phase` (ascending; `Unphased` last). Read `data.phase`; do not recompute. Regenerating `BOARD.md` is enough (no extra file).

## Steps

- [x] Add `## By phase` to `writeBoard`, phases ascending, Unphased last
- [x] Read `data.phase`; do not recompute
- [x] Cover in tests that regenerating `BOARD.md` includes the section

## Verification

`pnpm pb board` writes a phase section in `BOARD.md`. Items with no phase land under Unphased.

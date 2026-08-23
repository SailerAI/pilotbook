---
id: TASK-033
title: Split a parentless task into a new story
type: task
story: US-012
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [split, routing]
depends_on: [TASK-025, TASK-031]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: b0564cc89787 }
---
## Scope

Let `pb split` accept a parentless task that is not `already_small` and grow it into a story plus child tasks — the one place seed may create a parent (ADR-0004 consequence). Open point this task must settle: the new story still needs an `epic`, because ADR-0004 makes only *task* parents optional. Take the epic from an explicit argument and refuse with a `fix` when it is missing rather than inventing one. No `--orphan` flag and no `chore` type.

## Steps

- [x] Allow `splitItem` to target a task with no `story` when it is not `already_small`
- [x] Apply creates the story through `createItem` first, then the child tasks under it — still the shared `seedFromBrief` path, not a second writer
- [x] Take the new story's `epic` from an explicit `--epic` argument; refuse with `{ error, code, fix }` when it is absent
- [x] Reparent the original task under the new story instead of deleting it; the remaining children are created alongside it with `area` and `depends_on`
- [x] Tests: parentless split creates one story plus children, refusal without an epic, and an already-small parentless task still refuses

## Verification

`pnpm pb split TASK-NNN --epic EPIC-NNN` on a multi-criterion parentless task creates one story plus child tasks that each carry `area` and `depends_on`, reparents the original task under it, and `pnpm pb lint` exits 0.

---
id: TASK-041
title: Add boardPlan and pb board --dry-run
type: task
story: US-020
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: []
depends_on: [TASK-040]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: a3032cc88c11 }
---
## Scope

`boardPlan(ctx)` diffs IDs parsed from existing `BOARD.md` table rows against generated content and returns `{ inSync, added, orphans }`. Orphans carry last-known status from the parsed row. `pb board --dry-run` prints that plan and writes nothing.

## Steps

- [x] Parse IDs (and status headings) out of the existing `## By status` table rows
- [x] Diff against generated board markdown without writing
- [x] Wire `pb board --dry-run` in the CLI to `boardPlan`

## Verification

`pnpm test` covers in-sync, added, orphans-with-status, and no-write. `pnpm typecheck` and `pnpm lint` are clean.

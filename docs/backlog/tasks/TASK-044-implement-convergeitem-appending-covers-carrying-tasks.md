---
id: TASK-044
title: Implement convergeItem appending covers-carrying tasks
type: task
story: US-016
status: done
priority: P1
estimate: 3
phase: 2
owner: unassigned
area: backend
tags: [converge]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-001]
adrs: [ADR-0007]
covers: ["US-016#1", "US-016#2", "US-016#3", "US-016#4"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: ba8f4822971a }
---
## Scope

Add `convergeItem(ctx, id, { dryRun })` in `src/ops/converge.ts`. Gap source is `analyzeGraph` scoped to a story or the child stories of an epic, narrowed to uncovered criteria. Each gap becomes a task created through `createItem` (BR-001) with `covers`, inherited `business_rules` / `adrs`, and the parent `story`. `--dry-run` returns `converged` or a plan and writes nothing. Write guards refuse anything that is not a new file under the task dir (`unsafe-write`). A second converge with no remaining gaps leaves files byte-identical.

## Steps

- [x] Export `convergeItem` that plans one task per uncovered `ID#N` criterion
- [x] `--dry-run` reports `converged` or the plan with no writes
- [x] Apply path uses `createItem` with `skipBoard`; wrap the FS so only new task files are written
- [x] Tests in `test/converge.test.ts` cover dry-run, apply, idempotence, inherited links, and `unsafe-write`

## Verification

`pnpm test` covers dry-run, apply, second-converge byte identity, no BR/ADR auto-tasks, and unsafe-write. `pnpm typecheck` and `pnpm lint` are clean.

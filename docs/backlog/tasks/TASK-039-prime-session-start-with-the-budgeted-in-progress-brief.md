---
id: TASK-039
title: Prime session start with the budgeted in-progress brief
type: task
story: US-022
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: []
depends_on: [TASK-038]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: c1dd99906617 }
---
## Scope

`sessionStart` hands the agent the highest-priority in-progress brief under a budget instead of a
summary line. Depends on TASK-038 for the truncation diagnostic.

## Steps

- [x] Add a `hooks.prime_budget` config key with snake_case YAML parsing and a default
- [x] Pick the priming target by reusing the `nextReady` ladder ordering
- [x] Append the rendered brief and any `brief_truncated` diagnostic to the hook output
- [x] Drop the trailing `Run pb brief <ID> before implementing.` line per BR-003

## Verification

`pnpm test` covers priming with an in-progress item, the `pb next` fallback, and a truncated primed
brief. `pnpm typecheck` and `pnpm lint` are clean.

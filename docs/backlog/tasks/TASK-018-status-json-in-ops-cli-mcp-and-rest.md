---
id: TASK-018
title: Status JSON in ops, CLI, MCP, and REST
type: task
story: US-006
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [status, ops]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: a1908c16d85d }
---
## Scope

Extract `itemState` / `listReady` / `statusOf` from `src/ops/query.ts`. Wire `pb status`, MCP `status`, and `GET /api/status/:id` (optional no-id list). Completions in `src/ops/complete.ts`. Ready items still have `requires: []`. Keep `explain` separate.

## Steps

- [x] Extract `itemState`, `listReady`, and `statusOf` in ops: `done`/`cancelled` from frontmatter; else `blocked` if any local `depends_on` is missing or not `done`/`cancelled`; else `ready`. Remote `repo#ID` refs appear in `requires` but do not block
- [x] `requires` is every `depends_on` as `{ id, state }` (always an array); `missingDeps` is unmet local blockers only; `unlocks` is one-hop reverse `depends_on` as `{ id, state, title }`
- [x] Wire CLI `pb status`, MCP `status`, `GET /api/status/:id`, optional `GET /api/status` → `{ items: listReady() }`, and completions
- [x] Tests: ready item still has `requires: []`; `listReady` topological order with index tie-break; remote refs do not block

## Verification

`pnpm test` covers `statusOf` and `listReady` with injected fs. `test/serve.test.ts` covers the new route. CLI, MCP, and REST call the same ops function.

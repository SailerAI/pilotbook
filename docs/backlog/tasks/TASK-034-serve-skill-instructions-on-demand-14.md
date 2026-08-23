---
id: TASK-034
title: Ops list and read packaged skills
type: task
story: US-014
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [instructions, ops]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 7daf0d37108c }
---
## Scope

Read packaged `skills/*.md` via `bundledSkills()` / `SHIPPED_SKILLS`. `listSkills()` returns `{ name, description }[]` from skill frontmatter. `skillOf(name)` returns `{ name, commands, writes, done, body }`. Unknown name throws `PilotbookError` (404).

## Steps

- [x] Add `src/ops/instructions.ts` that parses shipped skill files with `parseFrontmatter`
- [x] Export `listSkills` and `skillOf` from `src/ops/index.ts`
- [x] Tests: all six names with descriptions; `skillOf("implement")` has commands/writes/done/body; unknown name errors

## Verification

`pnpm test` covers list/read. Ops do not go through CLI or MCP.

---
id: TASK-031
title: Apply a split through seed with CLI and MCP
type: task
story: US-010
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [split, ops]
depends_on: [TASK-030]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: ed19d182eb97 }
---
## Scope

The apply path. Render the plan as the same heading markdown `planFromBrief` already parses, then create children through `seedFromBrief` / `createItem` so IDs stay allocated by ops (BR-001) — do not fork a second writer. A story splits into tasks that each carry `area` and `depends_on`; an epic splits into stories with no `area`, because stories have no such field. There is no confirmation prompt: omitting `--dry-run` applies.

## Steps

- [x] Render the plan into seed markdown and hand it to `src/ops/seed.ts`; reuse `planFromBrief` / `seedFromBrief` rather than writing files directly
- [x] Story target produces tasks with `area` and `depends_on`; epic target produces stories without `area`
- [x] Absent `--dry-run` applies immediately — no interactive confirm, since agents cannot confirm
- [x] Wire CLI `pb split`, MCP `split`, and completions (ADR-0002); no REST route and no UI
- [x] Tests: applied children exist with ops-allocated IDs, correct type per parent, `area`, and `depends_on`

## Verification

`pnpm pb split <ID>` creates children whose IDs came from `createItem`, each task carrying `area` and `depends_on`, and `pnpm pb lint` exits 0 afterwards.

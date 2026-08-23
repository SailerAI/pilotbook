---
id: TASK-038
title: Report brief truncation as a diagnostic with fetch stubs
type: task
story: US-017
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: []
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: a14e2fd858dd }
---
## Scope

`compileBrief` reports what a `--budget` drop removed instead of setting `truncated: true` in
silence. BR-003 treats silence as a violation.

## Steps

- [x] Add optional `target` to `Diagnostic` and keep `file`/`line`/`column` from the target item
- [x] Track `hop` on `Walked` so hop > 1 sections degrade to `{id, title, fetch}` stubs
- [x] Cost every walked section before the budget loop so `fix` can name a runnable larger budget
- [x] Emit one `brief_truncated` warning and render it plus the stubs in the markdown

## Verification

`pnpm test` covers the diagnostic shape, the runnable `fix`, the fetch stubs, and unlimited
behaviour with no `--budget`. `pnpm typecheck` and `pnpm lint` are clean.

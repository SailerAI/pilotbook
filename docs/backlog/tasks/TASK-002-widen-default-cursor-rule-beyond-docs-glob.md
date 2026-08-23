---
id: TASK-002
title: Widen default Cursor rule beyond docs glob
type: task
story: US-001
status: done
priority: P1
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [dogfood, init]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 0f5eae25eb4a }
---
## Scope

`pb init` writes `.cursor/rules/pilotbook.mdc` with `globs: docs/**/*.md` and `alwaysApply: false`. Agents editing `src/` never see the rule. This repo locally set `alwaysApply: true`; the shipped default should match how people actually implement.

## Steps

- [x] Change the bundled Cursor rule in `src/ops/init.ts` so it applies outside `docs/` (always-apply, or globs that include source)
- [x] Cover the installed rule text in an init test
- [x] Keep this repo's local rule in sync if the default catches up

## Verification

A consumer `pb init` installs a rule that applies when editing application source, not only markdown under `docs/`.

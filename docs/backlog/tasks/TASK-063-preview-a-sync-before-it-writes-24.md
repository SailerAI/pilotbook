---
id: TASK-063
title: Keep dry-run from writing Notion or markdown
type: task
story: US-040
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-062]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0001]
covers: ["US-040#2"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 853bcb6f2ae9 }
---
## Scope

`--dry-run` performs no Notion POST/PATCH/DELETE and no markdown writes.

## Steps

- [x] Guard writes behind `dryRun === false`
- [x] Test that fetch mock sees only GETs/queries if any

## Verification

Test title `US-040#2`.

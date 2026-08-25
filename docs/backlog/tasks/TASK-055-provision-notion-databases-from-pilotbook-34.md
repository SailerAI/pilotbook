---
id: TASK-055
title: Persist database ids and skip duplicate init
type: task
story: US-038
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-054]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0008]
covers: ["US-038#2"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: be5739a3f02b }
---
## Scope

Write `id` and `data_source_id` into `pilotbook.config.yml` after init. A second `--init` with all six ids present does not POST databases again.

## Steps

- [x] Serialize interop.notion.databases back to yaml
- [x] Short-circuit when all six exist
- [x] Test idempotent init

## Verification

Second init POSTs zero databases. Test title `US-038#2`.

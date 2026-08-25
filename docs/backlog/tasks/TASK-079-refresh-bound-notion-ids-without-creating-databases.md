---
id: TASK-079
title: Refresh bound Notion ids without creating databases
type: task
story: US-043
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-078]
created: 2026-08-25
updated: 2026-08-25
business_rules: [BR-002]
adrs: [ADR-0008]
covers: ["US-043#5"]
verified: { at: 2026-08-25, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: aa1b621fe9eb }
---
## Scope

`pb sync --init` retrieves each already-bound database and refreshes stored `id` / `data_source_id`. Missing mappings error with a pointer to the wizard. Ops never POST `/databases`.

## Steps

- [x] Replace create-on-init with retrieve-and-persist
- [x] Error when nothing is bound
- [x] Keep push/pull on mapped types only

## Verification

Tests titled `US-043#5`.

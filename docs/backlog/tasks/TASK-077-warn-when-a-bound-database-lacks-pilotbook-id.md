---
id: TASK-077
title: Warn when a bound database lacks Pilotbook ID
type: task
story: US-043
status: done
priority: P1
estimate: 1
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-076]
created: 2026-08-25
updated: 2026-08-25
business_rules: [BR-002]
adrs: [ADR-0008]
covers: ["US-043#3"]
verified: { at: 2026-08-25, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 18118521f8ab }
---
## Scope

Binding a database that has no Pilotbook ID property persists the mapping and returns a warning. Ops do not PATCH the remote schema.

## Steps

- [x] Detect missing Pilotbook ID on retrieve
- [x] Return warnings from `bindNotion`
- [x] Do not PATCH data sources or databases

## Verification

Tests titled `US-043#3`.

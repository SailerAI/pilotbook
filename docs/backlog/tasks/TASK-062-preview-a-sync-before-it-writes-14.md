---
id: TASK-062
title: Classify sync actions in the dry-run report
type: task
story: US-040
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-061]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0002, ADR-0008]
covers: ["US-040#1"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 4aa0dd12fbc3 }
---
## Scope

Dry-run report lists per-item `create` | `update` | `skip` | `conflict` | `intake` with id and side (`to` | `from`).

## Steps

- [x] Action classifier
- [x] Structured `actions` array on the result

## Verification

Test title `US-040#1`.

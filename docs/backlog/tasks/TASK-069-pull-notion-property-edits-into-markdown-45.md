---
id: TASK-069
title: Reject invalid Notion enums on pull
type: task
story: US-041
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-068]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0001]
covers: ["US-041#4"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 352985cb2b26 }
---
## Scope

Unknown status or enum from Notion is not written. Lint stays clean; the action is skip or conflict.

## Steps

- [x] Validate against type enums before `updateItem`
- [x] Test invalid status does not persist

## Verification

Test title `US-041#4`.

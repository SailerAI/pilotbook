---
id: TASK-064
title: Emit the dry-run report as JSON
type: task
story: US-040
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-063]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-040#3"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: cbe7264ef67a }
---
## Scope

`--json` emits the same structured payload as the ops return value.

## Steps

- [x] CLI `--json` path
- [x] Test JSON shape

## Verification

Test title `US-040#3`.

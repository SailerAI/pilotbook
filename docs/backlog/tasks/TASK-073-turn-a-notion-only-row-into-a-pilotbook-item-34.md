---
id: TASK-073
title: Skip intake when the Notion title is blank
type: task
story: US-042
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-072]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-001]
adrs: [ADR-0008]
covers: ["US-042#3"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 7a65096abaf8 }
---
## Scope

Blank-title Notion rows are skipped and reported; no untitled item is created.

## Steps

- [x] Treat empty Name as skip
- [x] Test no createItem

## Verification

Test title `US-042#3`.

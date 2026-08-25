---
id: TASK-071
title: Allocate a Pilotbook item from a Notion-only row
type: task
story: US-042
status: done
priority: P1
estimate: 3
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-061]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0008]
covers: ["US-042#1", "US-042#2"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 7d1c23e02cf8 }
---
## Scope

A Notion page with empty Pilotbook ID and a title becomes `createItem` for that database's type. The allocated id matches prefix/pad and was not taken from Notion.

## Steps

- [x] Detect empty Pilotbook ID
- [x] `createItem` with type from database
- [x] Assert BR-001 prefix

## Verification

Test titles `US-042#1` and `US-042#2`.

---
id: TASK-058
title: Patch an existing Notion page on re-push
type: task
story: US-039
status: done
priority: P1
estimate: 3
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-057]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0008]
covers: ["US-039#2"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 662b79daea29 }
---
## Scope

A second push PATCHes the existing page (title, status, tags, type-specific scalars, parent/depends_on/rule relations) and does not POST a duplicate.

## Steps

- [x] Map scalars and relations
- [x] PATCH by cached or queried page id
- [x] Assert no second POST in tests

## Verification

Test title `US-039#2`.

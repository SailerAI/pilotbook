---
id: TASK-068
title: Skip Notion body and relation pulls
type: task
story: US-041
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-067]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0008]
covers: ["US-041#3"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 8c8b4f4abecc }
---
## Scope

Pull ignores page body and relation edits (edges stay markdown-owned). Report those as skip.

## Steps

- [x] Do not write body from Notion
- [x] Do not rewrite depends_on / parent / rules from Notion relations

## Verification

Test title `US-041#3`.

---
id: TASK-066
title: Pull bidirectional scalars through updateItem
type: task
story: US-041
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
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0008]
covers: ["US-041#1"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 95b8794300b2 }
---
## Scope

When Notion bidirectional scalars changed and local markdown did not, pull calls `updateItem` so lint still applies.

## Steps

- [x] Compare last-push hash vs Notion vs local
- [x] `updateItem` for status, title, owner, priority, tags, estimate, phase

## Verification

Test title `US-041#1`.

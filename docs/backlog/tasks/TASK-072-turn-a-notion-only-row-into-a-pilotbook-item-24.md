---
id: TASK-072
title: Write the allocated id back onto the Notion page
type: task
story: US-042
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-071]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-001]
adrs: [ADR-0008]
covers: ["US-042#1"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: f79d950ba584 }
---
## Scope

After intake, PATCH the Notion page's Pilotbook ID property to the allocated id.

## Steps

- [x] PATCH properties.Pilotbook ID
- [x] Cache page id in `.pb/`

## Verification

Test title `US-042#1`.

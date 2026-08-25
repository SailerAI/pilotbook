---
id: TASK-060
title: Replace the POST-always export stub with upsert
type: task
story: US-039
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-059]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0002, ADR-0008]
covers: ["US-039#4"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 582190c55279 }
---
## Scope

`exportItems(..., "notion")` delegates to the upsert sync op. No POST-always path remains for Notion.

## Steps

- [x] Route Notion export through `syncNotion`
- [x] Keep Jira stub unchanged

## Verification

Test title `US-039#4`.

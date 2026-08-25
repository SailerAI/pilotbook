---
id: TASK-057
title: Create a Notion page when Pilotbook ID is missing
type: task
story: US-039
status: done
priority: P1
estimate: 3
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-056]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0008]
covers: ["US-039#1"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 996859576c04 }
---
## Scope

Push creates a page whose Pilotbook ID property equals the item id and caches the page id under `.pb/`. Mapping is regenerable by querying that property.

## Steps

- [x] Query data source by Pilotbook ID
- [x] POST page when missing
- [x] Write `.pb/notion-map.json`

## Verification

Test title `US-039#1`.

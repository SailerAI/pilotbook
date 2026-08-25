---
id: TASK-054
title: Create six Notion databases via the API
type: task
story: US-038
status: done
priority: P1
estimate: 3
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-053]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0008]
covers: ["US-038#1"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 955ac70184da }
---
## Scope

`syncNotion({ init: true })` POSTs six databases (epic, story, task, idea, adr, business-rule) under `parent_page_id` with typed properties and relations. Notion HTTP is injected so tests mock `fetch`. API version `2025-09-03`.

## Steps

- [x] Property schema per type
- [x] Create databases + data sources
- [x] Tests mock fetch

## Verification

Mocked init creates six databases with Name, Pilotbook ID, Status, Tags. Test title `US-038#1`.

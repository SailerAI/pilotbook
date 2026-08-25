---
id: TASK-075
title: Catalog existing Notion databases without a parent page
type: task
story: US-043
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: []
created: 2026-08-25
updated: 2026-08-25
business_rules: [BR-002]
adrs: [ADR-0002, ADR-0008]
covers: ["US-043#1"]
verified: { at: 2026-08-25, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: e3c764f2bd92 }
---
## Scope

`notionCatalog` searches Notion for databases, retrieves `data_source_id` and title, and does not require `parent_page_id`. A missing token returns `tokenOk: false` instead of throwing.

## Steps

- [x] Drop `parent_page_id` from `requireToken`
- [x] Paginate `POST /v1/search` filtered to databases
- [x] Retrieve each hit for `data_source_id` and title

## Verification

Tests titled `US-043#1`.

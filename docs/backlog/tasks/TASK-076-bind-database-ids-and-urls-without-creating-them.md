---
id: TASK-076
title: Bind database ids and URLs without creating them
type: task
story: US-043
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-075]
created: 2026-08-25
updated: 2026-08-25
business_rules: [BR-002]
adrs: [ADR-0002, ADR-0008]
covers: ["US-043#2"]
verified: { at: 2026-08-25, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 95c060bb0647 }
---
## Scope

`bindNotion` accepts a per-type map of database ids or Notion URLs, retrieves each, and persists `id` / `data_source_id`. It never POSTs `/databases`. Partial bind is allowed.

## Steps

- [x] Parse 32-hex ids, dashed UUIDs, and `notion.so` URLs
- [x] Persist via `persistNotionDatabases`
- [x] Leave unmapped types unchanged

## Verification

Tests titled `US-043#2`.

---
id: TASK-053
title: Add interop.notion to the config schema
type: task
story: US-038
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: []
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0008]
covers: ["US-038#1"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 0d8df15ac84c }
---
## Scope

Add `interop.notion` to `PilotbookConfig` and the strict Zod `fileSchema` so `parent_page_id`, `token_env`, `version`, `push_on_write`, and per-type `databases` parse. Defaults omit Notion so existing projects stay valid.

## Steps

- [x] Extend `PilotbookConfig` and `fileSchema`
- [x] Default `interop` to undefined / empty
- [x] Unit-test overlay parse

## Verification

A fixture config with `interop.notion` loads; a config without it still parses. Tests titled `US-038#1`.

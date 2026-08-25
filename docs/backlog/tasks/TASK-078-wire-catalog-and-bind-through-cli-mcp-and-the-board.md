---
id: TASK-078
title: Wire catalog and bind through CLI MCP and the board
type: task
story: US-043
status: done
priority: P1
estimate: 3
phase: 3
owner: unassigned
area: frontend
tags: [interop, notion, ui]
depends_on: [TASK-077]
created: 2026-08-25
updated: 2026-08-25
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-043#4"]
verified: { at: 2026-08-25, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: cb4cef6fae76 }
---
## Scope

CLI `pb sync --catalog` / `--bind`, MCP `sync` params, and `GET`/`PUT /api/notion` call the same ops. The board Notion wizard lists catalogs, accepts URLs, and saves bindings without a token field.

## Steps

- [x] CLI and MCP adapters
- [x] Thin REST routes in serve
- [x] Board wizard: token status, six independent picks, confirm warnings

## Verification

Tests titled `US-043#4` plus serve coverage for `/api/notion`.

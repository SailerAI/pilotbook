---
id: TASK-056
title: Fail init without credentials and wire CLI MCP
type: task
story: US-038
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-055]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0002, ADR-0008]
covers: ["US-038#3", "US-038#4"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: e66f02c687ef }
---
## Scope

Missing token or `parent_page_id` throws `PilotbookError` and writes nothing. `pb sync --init` and the MCP `sync` tool call the same op.

## Steps

- [x] Validate env/config before HTTP
- [x] CLI `sync` command
- [x] MCP tool adapter

## Verification

Tests titled `US-038#3` and `US-038#4`.

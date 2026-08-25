---
id: TASK-074
title: Wire intake through CLI and MCP
type: task
story: US-042
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-073]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-001, BR-002]
adrs: [ADR-0002]
covers: ["US-042#4"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 11af0656989a }
---
## Scope

CLI and MCP intake call the same ops function (pull path).

## Steps

- [x] Same `sync` op as pull
- [x] Test adapter uses ops

## Verification

Test title `US-042#4`.

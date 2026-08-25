---
id: TASK-065
title: Wire dry-run through CLI and MCP
type: task
story: US-040
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-064]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-040#4"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 8ee88a8cfa4f }
---
## Scope

CLI and MCP dry-run call the same ops function. `--dry-run` defaults true unless `--dry-run=false`.

## Steps

- [x] Default dry-run true
- [x] MCP `dryRun` param

## Verification

Test title `US-040#4`.

---
id: TASK-070
title: Wire pull through CLI and MCP
type: task
story: US-041
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-069]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-041#5"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 690588aa70d5 }
---
## Scope

`pb sync --from notion` and MCP `sync` call the same pull op.

## Steps

- [x] `--from notion` selects pull
- [x] Default both directions when neither flag is set (apply path)

## Verification

Test title `US-041#5`.

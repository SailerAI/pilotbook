---
id: TASK-061
title: Wire push through CLI and MCP
type: task
story: US-039
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-060]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-039#5"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 0f40645b7595 }
---
## Scope

`pb sync --to notion` and MCP `sync` call the same push op. Document the command in the README.

## Steps

- [x] CLI args `--to` / `--from` / `--init`
- [x] MCP tool
- [x] README row for `pb sync`

## Verification

Test title `US-039#5`.

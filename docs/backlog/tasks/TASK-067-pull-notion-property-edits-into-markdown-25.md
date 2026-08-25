---
id: TASK-067
title: Prefer Pilotbook on two-sided conflicts
type: task
story: US-041
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-066]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0008]
covers: ["US-041#2"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 613d3cd5ab78 }
---
## Scope

If both sides changed since the last push hash, Pilotbook wins, markdown is not clobbered, and the report lists `conflict`.

## Steps

- [x] Store push hash in `.pb/notion-map.json`
- [x] Conflict action in the report

## Verification

Test title `US-041#2`.

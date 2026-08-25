---
id: TASK-059
title: Replace Notion page children from markdown
type: task
story: US-039
status: done
priority: P1
estimate: 2
phase: 3
owner: unassigned
area: backend
tags: [interop, notion]
depends_on: [TASK-058]
created: 2026-08-24
updated: 2026-08-24
business_rules: [BR-002]
adrs: [ADR-0008]
covers: ["US-039#3"]
verified: { at: 2026-08-24, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: fbb28be8f3d0 }
---
## Scope

On push, replace page children from the markdown body. Pull of body stays out of scope.

## Steps

- [x] Convert markdown to Notion paragraph blocks (truncated)
- [x] Replace children after upsert

## Verification

Test title `US-039#3`.

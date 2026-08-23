---
id: TASK-008
title: Clarify detect and apply ops CLI and MCP
type: task
story: US-002
status: done
priority: P1
estimate: 3
phase: 2
owner: unassigned
area: backend
tags: [clarify, ops]
depends_on: [TASK-007]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 78c60dd3456d }
---
## Scope

Deterministic `clarifyItem` / `applyClarifications` in ops. Detection emits a bounded question set; answers write back as criteria, a new business-rule, or an open-question section. CLI and MCP are thin adapters.

## Steps

- [x] Detect graph-justified gaps on idea/story/epic; `{ ready: true, questions: [] }` writes nothing
- [x] Apply `criterion`, `business-rule`, and `open-question` write-backs via `createItem` / body upsert
- [x] Wire `pb clarify`, MCP `clarify`, completions, and `test/clarify.test.ts`

## Verification

A bare idea/story detects questions. Applying each write-back kind lands in the graph. Ready detection does not write. Unknown IDs refuse.

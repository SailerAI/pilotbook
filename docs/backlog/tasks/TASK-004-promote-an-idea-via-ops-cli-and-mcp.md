---
id: TASK-004
title: Promote an idea via ops CLI and MCP
type: task
story: US-003
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [promote, ops]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 39b62d056f8b }
---
## Scope

Add `promoteIdea` in ops, wire `pb promote` and the MCP `promote` tool, and cover dry-run plus gate refusals (including rejected ideas) with tests.

## Steps

- [x] Implement `promoteIdea` (epic/story, dry-run, gate on status/Why/impact/effort, `fix` on refusal)
- [x] Wire CLI, MCP, and completions; JSON errors include `{ error, code, fix }`
- [x] Tests for success, dry-run, and refused promote

## Verification

`pnpm test` covers promote. An exploring idea promotes to a new epic with `promoted_to` set and `status: promoted`.

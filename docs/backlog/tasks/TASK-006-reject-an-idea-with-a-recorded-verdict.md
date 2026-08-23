---
id: TASK-006
title: Reject an idea with a recorded verdict
type: task
story: US-004
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [assess, ops]
depends_on: [TASK-004]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 22ced8e9f816 }
---
## Scope

Add `rejectIdea` so a kill is a first-class write: `status: rejected`, a `## Verdict` section, CLI/MCP `reject`, and `nextReady` never lists rejected items.

## Steps

- [x] Implement `rejectIdea` with reason + date in `## Verdict`
- [x] Wire `pb reject` and MCP `reject`; JSON includes `verdict: kill`
- [x] Refuse `promoteIdea` on rejected ideas; explicit `nextReady` filter + regression test

## Verification

Rejecting an idea stamps `rejected` and a Verdict. Promote refuses it. `pb next` does not list it.

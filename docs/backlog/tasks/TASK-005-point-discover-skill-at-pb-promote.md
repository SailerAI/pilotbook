---
id: TASK-005
title: Point discover skill at pb promote
type: task
story: US-003
status: done
priority: P1
estimate: 1
phase: 2
owner: unassigned
area: docs
tags: [promote, discover]
depends_on: [TASK-004]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: aac9f53fa18b }
---
## Scope

`skills/discover.md` currently forbids promotion. Point it at `pb promote` once the command exists.

## Steps

- [x] Update discover to call `pb promote` instead of forbidding promotion
- [x] Mention the impact/effort/Why gate

## Verification

The skill names `pb promote` and does not tell agents to leave ideas unpromoted forever.

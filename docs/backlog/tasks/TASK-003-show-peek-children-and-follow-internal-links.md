---
id: TASK-003
title: Show peek children and follow internal links
type: task
story: US-030
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: frontend
tags: [ui, navigation]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 4be4dd9bf784 }
---
## Scope

Peek shows parent and immediate children, follows internal markdown/brief links, and a back stack restores the previous item. `schemaOf` exposes `parent` so the UI does not hardcode hierarchy fields.

## Steps

- [x] Expose `parent` on each type in `schemaOf` and cover it in tests
- [x] Render parent/children in the peek with a back stack
- [x] Resolve ID hrefs, relative `.md` paths against `rel`, autolink bare IDs, and handle Brief clicks

## Verification

`pnpm test` covers schema `parent`. Opening an epic in the UI lists stories; clicking a child or a body ID opens that item; Back restores the parent.

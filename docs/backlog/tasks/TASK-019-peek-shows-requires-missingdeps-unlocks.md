---
id: TASK-019
title: Peek shows requires, missingDeps, unlocks
type: task
story: US-006
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: frontend
tags: [status, ui]
depends_on: [TASK-018]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 9649c0471f7f }
---
## Scope

Peek in `ui/index.html` / `ui/app.js` fetches `/api/status/:id` for `requires`, `missingDeps`, and `unlocks`. The UI does not compute a second client graph.

## Steps

- [ ] Peek fetches `/api/status/:id` when an item is selected
- [ ] Render `requires`, `missingDeps`, and `unlocks` from that payload
- [ ] Do not reimplement ready/blocked or reverse-depends in the browser

## Verification

Opening an item in peek shows `requires` (always present), `missingDeps`, and `unlocks` from the status API. A ready item still lists `requires` as an empty array.

---
id: TASK-022
title: Header search hits /api/search
type: task
story: US-009
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: frontend
tags: [search, ui]
depends_on: [TASK-021]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 01966e9ea139 }
---
## Scope

Replace the id/title-only filter in `ui/app.js` with a call to `GET /api/search`. Empty box does not dump the graph.

## Steps

- [x] Header search box calls `GET /api/search?q=`
- [x] Empty/whitespace box does not dump the graph
- [x] Do not keep a client-only id/title filter as the search path

## Verification

Typing a query in the header hits `/api/search` and shows id/title/body matches. Clearing the box does not list the whole graph.

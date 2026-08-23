---
id: TASK-011
title: Add Ideas-tab demand form for clarifications
type: task
story: US-005
status: done
priority: P2
estimate: 3
phase: 2
owner: unassigned
area: frontend
tags: [ui, clarify]
depends_on: [TASK-009]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: f6cb8a571f3c }
---
## Scope

Ideas tab: one-line demand field submits to intake, renders ops questions as radio/select, and saves through the clarify endpoint. The UI does not detect ambiguity (ADR-0002).

## Steps

- [x] Demand field on the Ideas tab → intake → question form
- [x] Save answers via `/api/items/:id/clarify` then `refresh()` so kanban and peek show write-back
- [x] Do not reimplement detection in the browser

## Verification

Submitting a sentence creates an idea, shows the question set from ops, and after save the item body/frontmatter reflects the answers.

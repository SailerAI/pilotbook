---
id: EPIC-003
title: When to build
type: epic
status: done
priority: P1
estimate: 8
phase: 2
owner: unassigned
tags: [funnel, sequencing]
depends_on: []
related: []
goal: A builder can see what is unblocked, what it unlocks, where it sits on the roadmap, and search the graph without leaving the repo.
created: 2026-08-23
updated: 2026-08-23
---

## Outcome

`pb status`, `pb next`, the roadmap view, and `pb search` answer "what do I pick, what does it unblock, where is it, and where is that ID" from the graph.

## Stories

- US-006 — Expose status JSON with requires, missingDeps, and unlocks
- US-007 — Order next by a fixed action ladder
- US-008 — Render a roadmap from phase
- US-009 — Search the graph from CLI and UI
- US-030 — Navigate children and internal links from the peek

## Success metrics

- `pb status <ID> --json` returns `requires` for every status, not only blocked
- `pb next` prefers resume in-progress, then review, then ready, then backlog
- The UI has a phase-ordered roadmap and a search box that hits `/api/search`

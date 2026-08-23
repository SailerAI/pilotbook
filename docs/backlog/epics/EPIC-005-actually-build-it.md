---
id: EPIC-005
title: Actually build it
type: epic
status: backlog
priority: P1
estimate: 21
phase: 2
owner: unassigned
tags: [execution, agents]
depends_on: []
related: []
goal: An agent can pick unblocked work, load a budgeted brief, ship against it, and the graph reports coverage, drift, and remaining gaps without improvising.
created: 2026-08-23
updated: 2026-08-23
---

## Outcome

Init installs every skill. Agents load instructions on demand, a budgeted brief that reports truncation, a coverage analysis, an append-only converge loop, and a board that never silently downgrades status.

## Stories

- US-013 — Install all five skills from pb init
- US-031 — Install Cursor agent skills from pb init
- US-014 — Serve skill instructions on demand
- US-015 — Analyze graph coverage without an LLM
- US-016 — Converge by appending tasks only
- US-017 — Report brief truncation as a diagnostic
- US-018 — Publish the agent contract
- US-019 — Refuse to tick reviewer-owned criteria
- US-020 — Merge the board without downgrading status
- US-021 — Run an evidence-backed epic retrospective
- US-022 — Prime a session with the in-progress brief

## Success metrics

- `pb init` copies implement, groom, prioritize, architect, and discover
- `pb brief --budget N --json` includes `brief_truncated` with a runnable `fix`
- `pb analyze` exits non-zero on uncovered active rules or done stories with open tasks
- `pb converge` either leaves files byte-identical or only appends tasks

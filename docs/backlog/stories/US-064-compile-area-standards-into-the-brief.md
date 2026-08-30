---
id: US-064
title: Compile area standards into the brief
type: story
epic: EPIC-012
status: backlog
priority: P1
estimate: 3
phase: 4
owner: unassigned
tags: [standards, brief, agents]
depends_on: [US-063]
business_rules: [BR-002, BR-003]
adrs: [ADR-0001]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** coding agent starting a task in an area I have never touched,
**I want to** receive that area's accepted conventions in the brief,
**So that** the review does not send the work back over a house style I could not have known.

## Acceptance criteria

- [ ] Given a task with `area: backend`, when I run `pb brief TASK-NNN`, then accepted `STD-` items
      for `backend` are rendered, and standards for other areas are not.
- [ ] Given the authority ordering, when the brief renders, then standards appear below business
      rules and accepted ADRs — decisions bind, conventions guide — and the brief says so.
- [ ] Given a `draft` standard, when the brief renders, then it is omitted; only `accepted`
      standards compile.
- [ ] Given `--budget N`, when standards would exceed the budget, then they are dropped before
      binding rules and the drop is reported through the existing `brief_truncated` diagnostic with
      a runnable fix.
- [ ] Given a standard whose statement does not change what the agent does next, when it is
      reviewed, then it fails BR-003 and is cut.

## Notes

This is the payoff for US-063: a discovered convention is worth little in a folder and a lot in the
compiled brief for exactly the task that needs it.

## Out of scope

Discovering standards (US-063) and any per-file linting against a standard.

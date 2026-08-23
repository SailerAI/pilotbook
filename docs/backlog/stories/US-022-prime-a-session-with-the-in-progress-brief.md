---
id: US-022
title: Prime a session with the in-progress brief
type: story
epic: EPIC-005
status: backlog
priority: P1
estimate: 2
phase: 2
owner: unassigned
tags: [hooks, brief]
depends_on: [US-017]
business_rules: [BR-003]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As an** agent starting a session,
**I want to** receive the in-progress item's brief, not a summary line,
**So that** I begin already under the token budget and the binding rules.

## Acceptance criteria

- [ ] Given `pb hook session-start` (or the existing session-start hook in `src/ops/hooks.ts`), when an item is `in-progress`, then stdout includes `pb brief` of that item (budgeted)
- [ ] Given no in-progress item, when the hook runs, then it prints `pb next` instead of an empty summary
- [ ] Given truncation, when the primed brief is over budget, then the `brief_truncated` diagnostic is visible in the hook output
- [ ] Given BR-003, when priming, then the hook does not append repo tours or `AGENTS.md` duplicates of the brief

## Notes

Borrowed from Beads `bd prime`. The hook already runs; inject the brief. Depends on US-017 so truncation is reported.

## Out of scope

Compacting mid-session. Multi-item in-progress (lint can warn; pick the highest ladder rank from US-007 if present).

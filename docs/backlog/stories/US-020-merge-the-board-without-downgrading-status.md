---
id: US-020
title: Merge the board without downgrading status
type: story
epic: EPIC-005
status: backlog
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [board, ops]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** regenerate `BOARD.md` without losing advanced statuses or hand-written comments,
**So that** `pb board` is a merge, not a clobber.

## Acceptance criteria

- [ ] Given an existing board, when I run `pb board`, then item statuses in the graph are the source of truth and the generated markdown reflects them — regeneration never writes a lower status onto an item file
- [ ] Given `pb board --dry-run`, when I run it, then it reports `in_sync`, new entries, and orphans carrying their old statuses, and writes nothing
- [ ] Given custom keys and HTML comments in an item file, when the board regenerates, then those pass through untouched on the item
- [ ] Given a write failure, when serializing the board, then the previous `BOARD.md` is left in place (atomic replace)

## Notes

Borrowed from BMAD `sprint_plan.py`. Parsing, ordering, merging, and counting are not judgment calls. One explicit escape hatch may downgrade; `pb board` is not that hatch.

## Out of scope

`--set ID=status` as a new command (can be `pb update`). Rewriting the kanban UI.

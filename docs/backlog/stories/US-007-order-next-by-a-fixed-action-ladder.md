---
id: US-007
title: Order next by a fixed action ladder
type: story
epic: EPIC-003
status: backlog
priority: P1
estimate: 2
phase: 2
owner: unassigned
tags: [next, ops]
depends_on: [US-006]
business_rules: []
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** `pb next` to prefer resume, then review, then ready, then backlog,
**So that** in-flight work is not abandoned for a shinier unblocked item.

## Acceptance criteria

- [ ] Given an `in-progress` item that is still unblocked, when I run `pb next`, then it ranks above `review`, which ranks above `todo`/`ready`, which ranks above `backlog`
- [ ] Given equal ladder rank, when I run `pb next`, then existing phase-then-priority order still applies
- [ ] Given `--json`, when I inspect the list, then each row includes `ladder` so agents can see why it ranked there
- [ ] Given a `blocked` item, when I run `pb next`, then it is omitted (unchanged)

## Notes

Borrowed from BMAD `sprint_plan.py status`. Depends on US-006 so `ready`/`blocked` share one definition.

## Out of scope

Changing status enum values. UI reordering beyond using the same ops list.

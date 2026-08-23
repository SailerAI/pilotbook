---
id: EPIC-004
title: How to build
type: epic
status: backlog
priority: P1
estimate: 13
phase: 2
owner: unassigned
tags: [funnel, architecture]
depends_on: []
related: []
goal: A builder can split oversized work, record how it will be built, and see which shipped items a rule or ADR change just invalidated.
created: 2026-08-23
updated: 2026-08-23
---

## Outcome

Oversized stories become independently shippable tasks with `area` and `depends_on`. A rule or ADR bump reports every item whose brief just changed. A one-line fix does not require an epic.

## Stories

- US-010 — Split an item from graph complexity signals
- US-011 — Report sync-impact of a rule or ADR bump
- US-012 — Allow a small change to skip the epic and story

## Success metrics

- `pb split <ID> --dry-run` emits a plan; without `--dry-run` it creates items via seed
- `pb impact <ID>` (or `pb analyze --impact`) lists inbound stories and tasks, flagging `done`
- Parentless tasks lint clean; `estimate >= 3` or `P0` orphans warn (ADR-0004)

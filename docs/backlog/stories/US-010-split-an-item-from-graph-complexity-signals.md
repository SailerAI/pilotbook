---
id: US-010
title: Split an item from graph complexity signals
type: story
epic: EPIC-004
status: backlog
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [split, ops]
depends_on: []
business_rules: [BR-001]
adrs: [ADR-0001, ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** run `pb split <ID>` on an oversized story or epic,
**So that** independently shippable children are created with `area` and `depends_on` instead of one bloated item.

## Acceptance criteria

- [ ] Given a story, when I run `pb split US-NNN --dry-run`, then ops score complexity from graph signals (acceptance-criteria count, linked rules, distinct `code_map` areas) and emit a plan with a recommended split count — no files written
- [ ] Given the same command without `--dry-run`, when I confirm, then children are created through `planFromBrief` / `seedFromBrief` and IDs are allocated by `pb new`
- [ ] Given a task that already has `area` and a single criterion, when I split, then ops refuse with a diagnostic that it is already small
- [ ] Given CLI and MCP, when they split, then they call the same ops function

## Notes

Borrowed from Task Master `expand` + `analyze-complexity`. Scoring is deterministic; the agent may fill titles and bodies of the plan, not the count.

## Out of scope

LLM complexity scores. Splitting parentless tasks (US-012; ADR-0004 is accepted).

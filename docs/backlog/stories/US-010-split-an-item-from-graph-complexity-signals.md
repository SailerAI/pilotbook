---
id: US-010
title: Split an item from graph complexity signals
type: story
epic: EPIC-004
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [split, ops]
depends_on: []
business_rules: [BR-001]
adrs: [ADR-0001, ADR-0002, ADR-0003]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** run `pb split <ID>` on an oversized story or epic,
**So that** independently shippable children are created with `area` and `depends_on` instead of one bloated item.

## Acceptance criteria

- [ ] Given a story, when I run `pb split US-NNN --dry-run`, then ops score complexity from graph signals (acceptance-criteria count, linked rules, distinct `code_map` areas) and emit a plan with a recommended split count — no files written
- [ ] Given the same command without `--dry-run`, when ops apply the plan, then children are created through `planFromBrief` / `seedFromBrief` and IDs are allocated by `pb new` (BR-001) — there is no interactive confirmation step
- [ ] Given a story, when it splits, then the children are tasks and each carries `area` plus `depends_on`; given an epic, when it splits, then the children are stories and carry no `area`
- [ ] Given a task that already has `area` and a single criterion, when I split, then ops refuse with a diagnostic plus a `fix` saying it is already small
- [ ] Given CLI and MCP, when they split, then they call the same ops function — no REST route and no UI in this story

## Notes

Borrowed from Task Master `expand` + `analyze-complexity`. Scoring is deterministic; the agent may fill titles and bodies of the plan, not the count.

```
already_small = type == task AND area set AND criterion_count <= 1
score = criterion_count + linked_rule_count + distinct_code_map_areas
recommended_count = max(2, criterion_count, distinct_code_map_areas)
```

`criterion_count` comes from `parseChecklist` — ADR-0003 makes the checklist the criterion parser. `linked_rule_count` is `business_rules.length + adrs.length`. `distinct_code_map_areas` is the number of config `codeMap` keys whose path prefixes appear in the body, else tags that match those keys, else `1`. Refuse when `already_small` or `recommended_count <= 1`.

Apply renders the plan as the same heading markdown `planFromBrief` already parses, then hands it to `seedFromBrief` / `createItem` so IDs stay allocated (BR-001).

## Out of scope

LLM complexity scores. Splitting parentless tasks (US-012; ADR-0004 is accepted). Interactive confirmation prompts — agents cannot confirm. REST and UI transports.

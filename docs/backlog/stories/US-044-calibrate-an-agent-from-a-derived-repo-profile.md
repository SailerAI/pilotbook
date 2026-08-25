---
id: US-044
title: Calibrate an agent from a derived repo profile
type: story
epic: EPIC-009
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [agents, ops]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0009]
created: 2026-08-25
updated: 2026-08-25
---

## Story

**As an** agent starting discover, shape, architect, or implement,
**I want to** `pb profile --json` for a derived maturity level and calibration hints,
**So that** I interview a greenfield repo harder and reuse ADRs in a mature one instead of using the same script everywhere.

## Acceptance criteria

- [x] Given a loaded graph, when I run `pb profile --json`, then ops return `{ level, calibration, counts, knowledge, checks, codeMap, tests, git }` where `level` is one of `greenfield | shaping | operating | mature`, `counts` is items by type and status, `knowledge` has accepted ADR and active BR counts, `checks.configured` and `codeMap.configured` are booleans, and `calibration` is an array of short hints the agent must follow
- [x] Given markdown and config only (git missing or failing), when I profile, then `git` is `null` and `level` is still derived — maturity is never written to frontmatter
- [x] Given CLI and MCP, when they profile, then they call the same ops function (ADR-0002)

## Notes

Derive `level` from signals, not a stored field: greenfield = few/no work items and no accepted ADRs; shaping = ideas/epics exist but few done tasks; operating = in-progress work plus accepted ADRs; mature = accepted ADRs, active BRs, and `checks.commands` populated. Git (commit count, first-commit age) is optional enrichment. Two git calls max; never a Pilotbook server (ADR-0001).

## Out of scope

Storing maturity on items. An LLM call. Changing `pb brief`. Skill rewrite (US-047).

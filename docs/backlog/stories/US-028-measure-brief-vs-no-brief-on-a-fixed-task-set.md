---
id: US-028
title: Measure brief vs no brief on a fixed task set
type: story
epic: EPIC-006
status: backlog
priority: P1
estimate: 8
phase: 3
owner: unassigned
tags: [eval, brief]
depends_on: []
business_rules: [BR-003]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** maintainer,
**I want to** run a fixed task set with and without a compiled brief,
**So that** we know whether the brief changes completion and rework, instead of asserting that it does.

## Acceptance criteria

- [ ] Given a checked-in fixture of N tasks with known acceptance tests, when I run the eval harness, then each task is attempted twice (brief compiled vs brief withheld) and the run records `completed`, `rework_attempts`, and `tokens` per pair
- [ ] Given the results, when I read the artifact, then it is a JSON document ops can print (not a screenshot, not a chat log) with per-task and aggregate deltas
- [ ] Given BR-003's pruning test, when a brief line is dropped in a controlled ablation, then the harness records whether agent behaviour changed on that task
- [ ] Given the harness, when it runs in CI on a schedule or manual dispatch, then it does not block PR CI (EPIC-001's test job stays the merge gate)

## Notes

BMAD publishes 53% → 100% with a compressed index. This is the equivalent measurement for `pb brief`. The harness is an ops-shaped runner plus fixtures; it is not an LLM inside Pilotbook. This story produces the number; US-029 publishes it and amends BR-003 if the number contradicts the rule.

## Out of scope

Publishing the number in README (US-029). Changing the brief compiler based on a single run. Paying for eval in every PR.

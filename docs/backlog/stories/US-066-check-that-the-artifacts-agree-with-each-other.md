---
id: US-066
title: Check that the artifacts agree with each other
type: story
epic: EPIC-012
status: backlog
priority: P1
estimate: 5
phase: 4
owner: unassigned
tags: [analyze, consistency, ci]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0003, ADR-0007]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder about to start a sprint,
**I want to** know where the story, its tasks, and the decisions they cite disagree,
**So that** the contradiction is found before an agent implements one side of it.

## Acceptance criteria

- [ ] Given a story criterion that no task claims, when I run `pb analyze --consistency`, then it is
      reported with the story ID and criterion index.
- [ ] Given a task bound to a criterion index that no longer exists on its story (ADR-0007), when I
      run the check, then it is reported as a broken binding.
- [ ] Given a task linking an accepted ADR while its scope states the opposite, when I run the
      check, then it is reported as a suspected contradiction with both IDs — flagged for a human,
      never auto-resolved.
- [ ] Given any finding, when the check completes, then it exits non-zero, and `--format github`
      produces annotations in the same shape `pb lint` already emits.
- [ ] Given a clean graph, when I run the check, then it exits 0 and prints a one-line summary.
- [ ] Given the same files, when I run it twice, then the output is identical.

## Notes

Spec Kit runs `/analyze` between tasks and implement for exactly this reason. Pilotbook's version is
cheaper and stricter because the edges are already typed — most of these findings are graph queries,
not language comprehension.

The semantic half — terminology drift, two stories specifying conflicting behaviour in different
words — stays out of the op and belongs to a skill protocol, so `pb analyze` remains a pure
function.

## Out of scope

Fixing a contradiction, semantic comparison of prose, and drift between code and items (US-026).

---
id: US-058
title: Compile the outcome into the brief
type: story
epic: EPIC-011
status: backlog
priority: P1
estimate: 3
phase: 4
owner: unassigned
tags: [outcomes, brief, agents]
depends_on: [US-057]
business_rules: [BR-003]
adrs: [ADR-0001]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** coding agent making a trade-off mid-implementation,
**I want to** know which number this work is supposed to move and which must not degrade,
**So that** I have something to optimize toward besides passing the tests.

## Acceptance criteria

- [ ] Given a task whose parent chain reaches an epic with `outcomes:`, when I run
      `pb brief TASK-NNN`, then one Outcome block is rendered with the metric, the target, and the
      guardrail.
- [ ] Given the Outcome block, when it is rendered, then it is phrased as a directive an agent can
      act on ("optimize for X; do not regress Y"), satisfying BR-003 — a line that only reports a
      number does not earn its place in the budget.
- [ ] Given an item with no outcome anywhere in its parent chain, when I run `pb brief`, then no
      empty Outcome heading is emitted.
- [ ] Given `--budget N`, when the brief is truncated, then the Outcome block is retained above
      optional context, and truncation is still reported through the existing `brief_truncated`
      diagnostic.
- [ ] Given `pb brief --format json`, when it runs, then the outcome appears as structured fields,
      not only prose.

## Notes

Authority order is unchanged: business rules and accepted ADRs bind, the outcome directs, standards
guide. The outcome sits above acceptance criteria because it is the thing criteria are meant to
serve.

## Out of scope

Verifying that the work moved the number (US-060) and any per-task metric attribution.

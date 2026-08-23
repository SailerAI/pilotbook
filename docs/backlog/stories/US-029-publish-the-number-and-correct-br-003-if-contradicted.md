---
id: US-029
title: Publish the number and correct BR-003 if contradicted
type: story
epic: EPIC-006
status: backlog
priority: P2
estimate: 3
phase: 3
owner: unassigned
tags: [eval, brief]
depends_on: [US-028]
business_rules: [BR-003]
adrs: []
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder choosing a tool,
**I want to** read a published completion delta for brief vs no brief,
**So that** Pilotbook's claim is a measurement, not an assertion, and BR-003 is amended if the measurement contradicts it.

## Acceptance criteria

- [ ] Given US-028's artifact, when I open README or `docs/eval.md`, then it reports the latest aggregate `completed` and `rework_attempts` with and without a brief, plus the date and fixture git SHA
- [ ] Given a measurement where dropping a brief line does not change behaviour, when we publish, then BR-003 is bumped (`version` +1) to name that class of line as not-to-ship, or the compiler is changed so the line no longer ships
- [ ] Given a measurement where the brief does not improve completion, when we publish, then we say so — we do not omit the number
- [ ] Given BR-003, when the measurement supports the pruning test, then the rule can move from `draft` to `active` in the same change as the publish

## Notes

The number is the most credible artifact in the category only if we will print a negative result. Amending BR-003 is in scope; rewriting the compiler is a follow-up task under this story's parent epic, not a silent README hedge.

## Out of scope

Marketing copy that outruns the artifact. Per-competitor bake-offs. Auto-activating BR-003 without a human reading the number.

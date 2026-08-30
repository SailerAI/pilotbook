---
id: US-061
title: Hold a user-facing story to UX criteria
type: story
epic: EPIC-011
status: backlog
priority: P1
estimate: 5
phase: 4
owner: unassigned
tags: [ux, accessibility, criteria, lint]
depends_on: []
business_rules: [BR-002, BR-004]
adrs: [ADR-0003, ADR-0006]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder shipping something a person will look at,
**I want to** the loading, empty, error, and accessibility cases to be criteria that can fail,
**So that** an agent cannot ship a happy path and call the story done.

## Acceptance criteria

- [ ] Given a story whose tasks touch a user-surface `code_map` area, when it has no UX criteria,
      then `pb lint` warns with `file:line:col` and names the missing states.
- [ ] Given UX criteria, when they are written, then they use the same `## Acceptance criteria`
      checkbox shape as every other criterion (ADR-0003) and are bindable to a test (ADR-0006) —
      no second criteria mechanism.
- [ ] Given the required set, when it is checked, then it covers loading, empty, error, and success
      states, a keyboard-only path, and focus order.
- [ ] Given a UX criterion with no bound test and no named reviewer, when I run `pb analyze`, then
      it is reported unproven in exactly the same shape as any other unproven criterion.
- [ ] Given a story in a repo with no user-surface area configured, when I run `pb lint`, then no UX
      warning is emitted.

## Notes

Reusing the criteria machinery is the decisive choice: it inherits proof (EPIC-006), the board, and
verification for free, and it keeps "unusable" in the same failure class as "red test". Phrase
criteria in the testable form ADR-0003 already requires — Kiro's EARS notation is the same
instinct.

## Out of scope

Visual regression testing, a design system, contrast computation, and automated accessibility
scanning — a criterion may name a scanner, but running one is not this story.

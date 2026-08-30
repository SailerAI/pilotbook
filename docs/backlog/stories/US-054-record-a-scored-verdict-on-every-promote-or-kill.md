---
id: US-054
title: Record a scored verdict on every promote or kill
type: story
epic: EPIC-010
status: backlog
priority: P1
estimate: 5
phase: 4
owner: unassigned
tags: [decisions, gate, evidence]
depends_on: [US-051, US-053]
business_rules: [BR-001, BR-002]
adrs: [ADR-0001]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder answering for a call I made months ago,
**I want to** read the score and the evidence the call rested on,
**So that** I can tell whether the decision was wrong or the world changed.

## Acceptance criteria

- [ ] Given an idea, when I run `pb decide IDEA-NNN`, then a `## Decision` section is written with
      six criteria — problem validity, evidence strength, value vs cost of inaction, appetite fit,
      strategic fit, risk posture — each rated `strong | adequate | weak | unknown` with one line of
      justification, plus a verdict of `go | needs-clarification | kill`.
- [ ] Given a proposed `go` whose evidence strength is `weak` or `unknown`, or which cites zero
      benchmarks, when the verdict is written, then it is downgraded to `needs-clarification` and
      names the blocking questions and the stage to revisit.
- [ ] Given an idea with no verdict, or a verdict that is not `go`, when I run `pb promote`, then it
      refuses and names `pb decide` as the fix.
- [ ] Given a `kill` verdict, when I run `pb reject`, then the decisive reason is required and the
      record is kept — the idea is never deleted.
- [ ] Given a recorded verdict, when I run `pb explain IDEA-NNN`, then the verdict and its date are
      shown alongside the parent and child links.

## Notes

The scorecard lives in the idea file, not a sibling item: one file per idea keeps ADR-0001 obvious
and leaves `pb explain` unchanged. The evidence-strength gate is taken directly from Spec Kit's
assess extension, which downgrades a `go` rather than trusting the agent's enthusiasm.

## Out of scope

Ranking across ideas (US-055), assumption tracking (US-056), and any approval workflow with
signatures or reviewers.

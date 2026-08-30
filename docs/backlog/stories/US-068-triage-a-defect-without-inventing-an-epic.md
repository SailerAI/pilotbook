---
id: US-068
title: Triage a defect without inventing an epic
type: story
epic: EPIC-012
status: backlog
priority: P2
estimate: 8
phase: 4
owner: unassigned
tags: [defects, triage, types, verification]
depends_on: []
business_rules: [BR-001, BR-004]
adrs: [ADR-0004, ADR-0006]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder with something broken in production,
**I want to** triage, fix, and verify it against the criterion and rule it violated,
**So that** a two-line fix does not require an epic and a story to hold it, and the violation is
counted.

## Acceptance criteria

- [ ] Given `defect` registered in config (prefix `BUG-`), when I run `pb new defect --title "…"`,
      then an item is created with a reproduction, `severity`, and optional `violates:` edges to a
      criterion, business rule, or ADR.
- [ ] Given a defect, when the `triage` skill runs assess, then it locates suspected code paths and
      proposes a remediation and **modifies no source file**; only the fix step edits code, and any
      scope expansion beyond the assessment is recorded on the defect.
- [ ] Given a fix, when the test step runs, then a reproduction that was not actually executed is
      reported `not-run` or `partial` — never `verified` (BR-004).
- [ ] Given a defect linked to a business rule, when I run `pb analyze`, then repeat violations of
      that rule are counted, so a rule violated repeatedly surfaces as a rule problem.
- [ ] Given a closed defect, when I run `pb lint`, then it is clean without a parent story
      (ADR-0004).
- [ ] Given `pb next`, when a `P0` defect exists, then it is offered ahead of feature work in the
      same phase.

## Notes

Spec Kit's bug extension supplies the protocol and the two guardrails worth copying verbatim: only
the fix step touches source, and verification is never over-claimed. The Pilotbook addition is the
`violates:` edge — a rule broken twice in production is evidence that the rule or its proof is
wrong, and that is only visible if defects are in the graph.

Ship with US-012 so a small change has both somewhere to live and permission to skip the ceremony.

## Out of scope

Issue-tracker import, alerting, incident management, and postmortems.

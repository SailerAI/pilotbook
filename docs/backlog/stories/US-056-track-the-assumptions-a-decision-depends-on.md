---
id: US-056
title: Track the assumptions a decision depends on
type: story
epic: EPIC-010
status: backlog
priority: P2
estimate: 5
phase: 4
owner: unassigned
tags: [assumptions, risk, lint]
depends_on: [US-053, US-054]
business_rules: [BR-002]
adrs: [ADR-0001]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder who bet on something being true,
**I want to** track that assumption until it is tested or broken,
**So that** a false premise surfaces as a warning on the epic instead of a surprise in month three.

## Acceptance criteria

- [ ] Given `assumption` registered in config (prefix `ASM-`), when I run `pb new assumption`, then
      the item carries `statement`, `probability`, `impact`, `test` (the cheapest experiment that
      would falsify it), and `status: untested | testing | held | broken`.
- [ ] Given an idea or epic with `assumptions: [ASM-001]`, when I run `pb explain <ID>`, then the
      assumptions and their statuses are listed.
- [ ] Given an assumption with `status: broken` linked from a `backlog` or `in-progress` epic, when
      I run `pb lint`, then a warning names both the assumption and the epic.
- [ ] Given assumptions on one item, when I list them, then they are ordered by risk
      (probability × impact) so the riskiest is tested first.
- [ ] Given a `go` verdict, when it is written, then any assumption it depends on that is still
      `untested` is named in the decision record.

## Notes

Spec Kit's shape stage produces an "Assumptions to Validate" list and then nothing reads it. The
difference here is the edge and the lint warning — an assumption that cannot break an epic is a note,
not a control.

## Out of scope

Running experiments, any statistical treatment of probability, and blocking `done` on an untested
assumption.

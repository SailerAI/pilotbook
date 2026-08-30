---
id: US-059
title: Report work that claims no outcome
type: story
epic: EPIC-011
status: backlog
priority: P2
estimate: 3
phase: 4
owner: unassigned
tags: [outcomes, analyze, value]
depends_on: [US-057]
business_rules: [BR-002]
adrs: [ADR-0001]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder reviewing a quarter of shipped work,
**I want to** see which of it claimed an outcome and which was output with no thesis,
**So that** I can stop funding the part that was never argued for.

## Acceptance criteria

- [ ] Given the graph, when I run `pb value`, then epics and stories are grouped as: claims an
      outcome with a reading, claims an outcome with no reading, claims no outcome.
- [ ] Given a `done` epic whose outcome has no recorded reading, when I run `pb value`, then the
      command exits non-zero and names the epic.
- [ ] Given `pb value --json`, when it runs, then each outcome reports its target, latest reading,
      the reading's age, and the claiming items.
- [ ] Given the same files, when I run `pb value` twice, then the output is identical — it is a pure
      function of files on disk and never fetches a metric.
- [ ] Given `pb value`, when it reports, then it uses the same reporting shape as `pb analyze` so
      there is one diagnostic vocabulary, not two.

## Notes

`pb analyze` asks whether the graph is internally accounted for. `pb value` asks whether any of it
was worth doing. They are deliberately separate commands with one output shape.

## Out of scope

Recording the reading (US-060) and any comparison across time windows or cohorts.

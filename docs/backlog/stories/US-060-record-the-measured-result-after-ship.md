---
id: US-060
title: Record the measured result after ship
type: story
epic: EPIC-011
status: backlog
priority: P2
estimate: 5
phase: 4
owner: unassigned
tags: [outcomes, retrospective, evidence]
depends_on: [US-057, US-059]
business_rules: [BR-002, BR-004]
adrs: [ADR-0001]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder closing an epic,
**I want to** record what the number actually did against the target, including when it did nothing,
**So that** the next similar idea gets killed faster and on evidence.

## Acceptance criteria

- [ ] Given an outcome, when I run `pb read OUT-001 --value <n> --observed <date> --source <where>`,
      then a reading is appended to the outcome; existing readings are never rewritten.
- [ ] Given readings, when the epic retrospective (US-021) runs, then it reports actual vs target
      vs guardrail and states plainly whether the outcome moved.
- [ ] Given an outcome that did not move, when the retrospective is written, then "no movement" is a
      recorded result, not an omission.
- [ ] Given a recorded result, when a later idea is rejected, then `pb reject --reason` can cite the
      outcome ID as evidence, and the citation resolves under `pb lint`.
- [ ] Given a reading, when it is written, then its `source` is recorded so a reader can recompute
      it — Pilotbook stores the reading and never fetches it.

## Notes

BR-004 already says a criterion is proven by a green test or a named reviewer. A business result is
the same shape one level up: proven by a reading with a source and a date, or not proven at all.

## Out of scope

Any integration that fetches metrics, statistical significance, and attributing a movement to a
specific story.

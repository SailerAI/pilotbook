---
id: US-052
title: Warn when a decision rests on stale evidence
type: story
epic: EPIC-010
status: backlog
priority: P2
estimate: 3
phase: 4
owner: unassigned
tags: [benchmarks, evidence, lint]
depends_on: [US-051]
business_rules: [BR-002, BR-005]
adrs: [ADR-0001]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder about to start work planned months ago,
**I want to** be told which numbers behind the plan have expired,
**So that** I re-check the market before I spend the sprint, not after.

## Acceptance criteria

- [ ] Given `evidence.max_age_days` in `pilotbook.config.yml` (default 180), when I run `pb stale`,
      then every benchmark whose `observed` date is older than that is listed with its age, its
      confidence, and every item citing it.
- [ ] Given a `backlog` or `todo` item citing only expired benchmarks, when I run `pb stale`, then
      the command exits non-zero; given every citing item is `done` or `cancelled`, then it exits 0.
- [ ] Given no network access, when I run `pb stale`, then it completes normally — it reads dates,
      it never fetches.
- [ ] Given `pb stale --json`, when it runs, then output includes each benchmark ID, age in days,
      and the citing item IDs.
- [ ] Given an accepted ADR whose cited benchmarks have all expired, when I run `pb stale`, then
      the ADR is listed as resting on expired evidence, without changing its status.

- [ ] Given the capability, when the story closes, then it is reachable as an MCP tool, returns structured `--json` output, and is named by the skill that would run it (BR-005).

## Notes

Staleness is a warning about the world, not about the graph, so it is a separate command rather than
a `pb lint` rule — lint stays referential integrity. CI can choose to run it.

## Out of scope

Automatically re-fetching a benchmark, downgrading an ADR, and any notion of a benchmark's
correctness beyond its age.

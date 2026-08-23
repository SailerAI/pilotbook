---
id: US-024
title: Report unproven criteria
type: story
epic: EPIC-006
status: backlog
priority: P1
estimate: 5
phase: 3
owner: unassigned
tags: [analyze, criteria]
depends_on: [US-023]
business_rules: [BR-004]
adrs: [ADR-0003, ADR-0006]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** see which acceptance criteria have a green bound test,
**So that** coverage means "this criterion holds", not "a task mentions it".

## Acceptance criteria

- [ ] Given a JUnit report from US-023, when I run `pb analyze`, then the coverage table includes `Proved?` and `Test` columns keyed by `ID#N`
- [ ] Given a test title containing `US-024#2` that passed, when I read that row, then `Proved?` is yes and `Test` is the matching name
- [ ] Given a criterion with no matching title, or a match that failed or skipped, when I read that row, then it is unproven
- [ ] Given `--json`, when I read the payload, then `proved` and `unproven` are arrays of `{id, index, test?, status?}` and `coveragePercent` counts proved machine-ownable criteria separately from "has a covering task" (US-015)

## Notes

Extends US-015's table. ADR-0003 and ADR-0006 are accepted; this story is the `Proved?` column. Matching is exact token `ID#N`, not text similarity.

## Out of scope

Gating `done` (US-025). Ticking reviewer-owned boxes (US-019). Auto-writing test titles.

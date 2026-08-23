---
id: US-015
title: Analyze graph coverage without an LLM
type: story
epic: EPIC-005
status: backlog
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [analyze, lint]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0002, ADR-0003]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** run `pb analyze` as a graph query,
**So that** coverage gaps that referential lint cannot see are exact, millisecond, and repo-wide.

## Acceptance criteria

- [ ] Given the graph, when I run `pb analyze`, then it reports: active business rules with no inbound story/task edge, accepted ADRs with no inbound edge, stories `done` with open child tasks, and acceptance criteria with no covering task (ADR-0003)
- [ ] Given `--json`, when I read the payload, then it includes a coverage table (`Requirement Key | Has Task? | Task IDs | Notes`) and a `coveragePercent`
- [ ] Given uncovered active rules or done-with-open-children, when I run `pb analyze` in CI, then it exits non-zero
- [ ] Given `pb lint`, when I run it, then existing dangling/cycle/unknown-field errors stay in lint — analyze does not duplicate them

## Notes

Borrowed from Spec Kit `/speckit.analyze`, computed from edges instead of inferred. ADR-0003 is accepted; criterion coverage is in scope. Ship the other checks first if the checklist parser is not yet landed.

## Out of scope

Ambiguity adjectives (those belong to `pb clarify`). LLM duplication detection.

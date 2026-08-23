---
id: US-006
title: Expose status JSON with requires, missingDeps, and unlocks
type: story
epic: EPIC-003
status: backlog
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [status, ops]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As an** agent or script,
**I want to** run `pb status <ID> --json`,
**So that** I know whether the item is ready, what it requires, and what it unlocks — including when it is not blocked.

## Acceptance criteria

- [ ] Given any work item, when I run `pb status <ID> --json`, then the payload includes `state` (`ready` | `blocked` | `done` | `cancelled`), `requires` (every `depends_on` with its current state), `missingDeps` (only unmet blockers), and `unlocks` (items that list this ID in `depends_on`)
- [ ] Given a ready item, when I read `requires`, then the array is still present (possibly empty or all `done`) — never omitted
- [ ] Given several ready items, when listed, then they are in dependency order with declaration order breaking ties, so the first `ready` entry is the next thing to do
- [ ] Given CLI, MCP, and UI, when they ask for status, then they call the same ops function

## Notes

Borrowed from OpenSpec `status --json`. OpenSpec issue #1212 shipped silently because `requires` was only exposed for blocked artifacts. Do not repeat that.

## Out of scope

Changing `pb next` ordering (US-007). Transitive unlocks beyond one hop can be a follow-up.

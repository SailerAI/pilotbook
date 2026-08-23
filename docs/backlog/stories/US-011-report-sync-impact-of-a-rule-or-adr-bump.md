---
id: US-011
title: Report sync-impact of a rule or ADR bump
type: story
epic: EPIC-004
status: backlog
priority: P2
estimate: 5
phase: 2
owner: unassigned
tags: [impact, ops]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0005]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** see every story and task whose brief changed when a rule or ADR version bumps,
**So that** shipped work against a moved decision is visible instead of silently stale.

## Acceptance criteria

- [ ] Given I bump `version` on an active BR or accepted ADR, when I run `pb impact <ID>` (or `pb analyze --impact <ID>`), then it lists inbound stories and tasks
- [ ] Given that list, when an item is `done`, then it is flagged as shipped against the previous version — status is not rewritten
- [ ] Given a version bump that does not change body hash, when I lint, then it is a warning, not an impact event
- [ ] Given a body change of an active/accepted rule or ADR without a version bump, when I lint, then it is an error (per ADR-0005)

## Notes

ADR-0005 is accepted: integer `version` on ADRs, optional `amended`, no `ratified` (`created` + `status: accepted` is ratification). Complexity Tracking (`Violation | Why Needed | Simpler Alternative Rejected Because`) lives in the ADR body, not as a new type.

## Out of scope

Auto-reopening done work. Semver strings. An event log of bumps.

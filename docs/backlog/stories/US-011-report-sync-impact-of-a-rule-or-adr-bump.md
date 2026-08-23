---
id: US-011
title: Report sync-impact of a rule or ADR bump
type: story
epic: EPIC-004
status: done
priority: P2
estimate: 5
phase: 2
owner: unassigned
tags: [impact, ops]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0005]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** see every story and task whose brief changed when a rule or ADR version bumps,
**So that** shipped work against a moved decision is visible instead of silently stale.

## Acceptance criteria

- [ ] Given an `adr`, when it is created or parsed, then it carries `version` (integer, default 1) and an optional `amended` date; given a `business-rule` or an `adr` after backfill, then `content_hash` is a required field
- [ ] Given an active BR or accepted ADR whose body hash differs from `content_hash`, when I lint, then it is an error carrying `fix: pb bump <ID>` (per ADR-0005)
- [ ] Given `pb bump <ID>`, when the body hash already equals `content_hash`, then ops warn, write nothing, and no impact is implied
- [ ] Given `pb bump <ID>` on a body that did change, when it succeeds, then `version` increments, `amended` is set, and `content_hash` is refreshed — the version is never hand-written
- [ ] Given I bump an active BR or accepted ADR, when I run `pb impact <ID>`, then it lists every story and task with an inbound `business_rules` / `adrs` edge to that item, reporting the item's current `version`
- [ ] Given that list, when an item is `status: done`, then it is flagged as shipped against the previous version — status is not rewritten
- [ ] Given CLI `pb impact` / `pb bump` and MCP `impact` / `bump`, when they run, then they call the same ops functions (ADR-0002) — no REST route

## Notes

ADR-0005 is accepted: integer `version` on ADRs, optional `amended`, no `ratified` (`created` + `status: accepted` is ratification). Complexity Tracking (`Violation | Why Needed | Simpler Alternative Rejected Because`) lives in the ADR body, not as a new type.

`content_hash` is the sha256 of the markdown body only, truncated to 12 hex characters like `verified.hash`. Frontmatter title/tags/status edits are therefore not impact events. Exclude `content_hash` itself when serializing for any other hash so the field cannot chase itself.

Lint stays a pure function of the files (ADR-0001): the stored hash, not git, is the change signal. `pb bump` is to `version` what `pb new` is to IDs — the allocator, so no one hand-edits three fields at once.

## Out of scope

Auto-reopening done work. Semver strings. An event log of bumps. `pb analyze --impact` as the entry point (US-015 owns `analyze`; alias later). Git diff or git blame as the change signal. REST and UI transports.

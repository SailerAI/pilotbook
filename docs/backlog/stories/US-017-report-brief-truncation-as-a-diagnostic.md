---
id: US-017
title: Report brief truncation as a diagnostic
type: story
epic: EPIC-005
status: backlog
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [brief, budget]
depends_on: []
business_rules: [BR-003]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As an** agent,
**I want to** `pb brief <ID> --budget N --json` to tell me what it dropped,
**So that** a silent truncation cannot hide a binding rule.

## Acceptance criteria

- [ ] Given `--budget` smaller than the full brief, when I compile, then JSON includes `{severity: "warning", code: "brief_truncated", target, message, fix}` where `fix` is a runnable `pb brief <ID> --budget <larger>` command
- [ ] Given truncation, when sections are dropped, then lowest-authority sections go first (siblings/code-map, then depends_on, then parents) and rules/ADRs are last
- [ ] Given hops past the first, when budget is tight, then those items appear as `{id, title, fetch}` rather than full bodies
- [ ] Given no `--budget`, when I compile, then behaviour stays unlimited **or** a documented default budget is applied and still reports truncation — not silent

## Notes

`src/core/brief.ts` already truncates and sets `truncated: true`. Make it a first-class diagnostic. BR-003: silence is a violation.

## Out of scope

Changing authority order. A hard 50KB cap copied from OpenSpec.

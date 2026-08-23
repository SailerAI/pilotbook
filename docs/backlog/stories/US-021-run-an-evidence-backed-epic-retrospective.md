---
id: US-021
title: Run an evidence-backed epic retrospective
type: story
epic: EPIC-005
status: backlog
priority: P3
estimate: 5
phase: 2
owner: unassigned
tags: [retro, ops]
depends_on: [US-015]
business_rules: []
adrs: [ADR-0001]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder closing an epic,
**I want to** run `pb retro EPIC-NNN`,
**So that** defects no single task review could see are recorded with evidence and a verdict.

## Acceptance criteria

- [ ] Given an epic, when I run `pb retro <ID>`, then the report lists child stories and tasks, open vs done, and a verdict of `accepted` | `accepted-with-open-items` | `rejected`
- [ ] Given unfinished children, when I retro, then the machine verdict is `rejected` (human-overridable in the output, not silently flipped)
- [ ] Given a finding, when it is emitted, then it carries a source reference (file, line, commit, or item ID) — a claim it cannot point at does not make the report
- [ ] Given the command, when it writes, then it writes a markdown artifact under the epic (or `docs/backlog/retros/`) and does not execute action items

## Notes

Borrowed from BMAD `bmad-retrospective`. Catches the god class nine sessions built together. Depends on US-015 so coverage numbers can feed the report.

## Out of scope

Auto-creating tasks from findings (that is `pb converge`). Running the git log inside the CLI as a required dependency — item IDs are enough for v1.

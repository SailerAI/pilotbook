---
id: US-012
title: Allow a small change to skip the epic and story
type: story
epic: EPIC-004
status: backlog
priority: P2
estimate: 5
phase: 2
owner: unassigned
tags: [routing, schema]
depends_on: []
business_rules: [BR-001]
adrs: [ADR-0004]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** file a parentless task for a one-line fix,
**So that** small changes go straight to `pb next` without inventing an epic and a story.

## Acceptance criteria

- [ ] Given I run `pb new task --title "Fix typo in README" --area docs` with no `--story`, when the command returns, then the task is created and lint exits 0
- [ ] Given that task, when I run `pb brief` and `pb next`, then it is a first-class work item (brief from the task plus its own rules/ADRs/`depends_on`)
- [ ] Given a parentless task with `estimate >= 3` or `priority: P0`, when I lint, then I get a warning that it probably wants a story — not an error
- [ ] Given `pb board`, when rendering, then parentless tasks appear under an Ungrouped bucket, not a fake story

## Notes

ADR-0004 is accepted. Touches `assertRefs`, lint, brief, board, and `pb next`. Parentless is for small work; the estimate/P0 warning is the whole policy.

## Out of scope

A new `chore` type. Auto-creating a throwaway story. `--orphan` as a required flag.

---
id: US-012
title: Allow a small change to skip the epic and story
type: story
epic: EPIC-004
status: done
priority: P1
estimate: 3
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
- [ ] Given a task with no parent, when it is serialized, then the empty `story` key is omitted from the YAML — never `story: US-000`
- [ ] Given that task, when I run `pb brief` and `pb next`, then it is a first-class work item (brief from the task plus its own rules/ADRs/`depends_on`)
- [ ] Given a task, when it declares `business_rules` and `adrs`, then they are known array fields that lint resolves — not unknown-field noise
- [ ] Given a parentless task with `estimate >= 3` or `priority: P0`, when I lint, then I get a warning that it probably wants a story — not an error
- [ ] Given `pb board`, when `writeBoard` regenerates `BOARD.md`, then parentless tasks appear under an `Ungrouped` bucket, not a fake story — markdown only, same pattern as the phase section
- [ ] Given a parentless task that is not `already_small`, when `pb split` applies (US-010), then it may create a new story plus that story's child tasks — the one place seed creates a parent (ADR-0004 consequence)

## Notes

ADR-0004 is accepted. Touches `assertRefs`, lint, brief, board, and `pb next`. Parentless is for small work; the estimate/P0 warning is the whole policy.

Raised to P1: ADR-0004 is accepted, the epic outcome names parentless tasks, and the schema is on the dogfood path for one-line fixes in this repo. Estimate drops to 3 because the schema change is smaller than the split engine. Note that `sortWork` breaks a phase/priority tie by *ascending* estimate, so at P1 this story now sorts ahead of US-010 (estimate 5); the two tracks are independent, so either order is safe to hand an agent.

## Out of scope

A new `chore` type. Auto-creating a throwaway story. `--orphan` as a required flag. Vue or UI board changes.

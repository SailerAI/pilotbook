---
id: US-016
title: Converge by appending tasks only
type: story
epic: EPIC-005
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [converge, ops]
depends_on: []
business_rules: [BR-001]
adrs: [ADR-0001, ADR-0002, ADR-0007]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** run `pb converge <ID>` after implementation,
**So that** gaps against the brief become new tasks, never edits to existing code or silent status flips.

## Acceptance criteria

- [x] Given a story or epic, when I run `pb converge <ID> --dry-run`, then ops report either `converged` (no writes) or a plan of tasks to append
- [x] Given a non-dry run that finds gaps, when it writes, then the **only** permitted write is new task files linked to the same parent and the same `business_rules` / `adrs`, IDs allocated by `pb new`
- [x] Given a second converge with no remaining gaps, when I run it, then files are byte-identical to before
- [x] Given the command, when it would edit or delete code or existing item bodies, then it refuses

## Notes

Borrowed from Spec Kit `/speckit.converge`. Safety is the write constraint. Loop `implement → converge` until converged.

## Out of scope

An LLM that judges the codebase inside ops — the agent proposes gaps; ops only creates the tasks. Auto-running `pb verify` on the new tasks.

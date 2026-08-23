---
id: US-025
title: Gate done on proof
type: story
epic: EPIC-006
status: backlog
priority: P1
estimate: 3
phase: 3
owner: unassigned
tags: [lint, criteria]
depends_on: [US-024]
business_rules: [BR-002, BR-004]
adrs: [ADR-0003, ADR-0006]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** reviewer,
**I want to** lint to refuse `done` on a story whose machine-ownable criteria are unproven,
**So that** a checked box or a green suite cannot stand in for a named passing test.

## Acceptance criteria

- [ ] Given a story `status: done` with a criterion bound to a missing, failing, or skipped test, when I run `pb lint` and a JUnit report is present, then it errors `unproven-done` naming `ID#N`
- [ ] Given a story `status: done` whose bound tests all passed, and reviewer-owned (unbound) criteria are ticked, when I lint, then `unproven-done` is not raised
- [ ] Given a `done` story and no report file, when I lint locally, then it is a warning, not an error — same spirit as skipping `unverified-done` when `checks.commands` is empty
- [ ] Given CI after `checks.commands` (report present), when a machine-ownable criterion is unproven, then lint exits non-zero

## Notes

Mirrors `unverified-done` / `stale-verified` in `src/core/lint.ts` around the task `verified` hash. Proof is computed (ADR-0006), not stamped on the story. Complements US-019: unbound boxes stay human; bound boxes are this gate.

## Out of scope

Auto-reopening done stories. Writing `[x]` from a green test. Changing the task `verified` hash rules.

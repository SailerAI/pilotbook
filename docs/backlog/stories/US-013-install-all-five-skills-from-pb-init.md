---
id: US-013
title: Install all five skills from pb init
type: story
epic: EPIC-005
status: done
priority: P0
estimate: 2
phase: 2
owner: unassigned
tags: [init, bug]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** consumer running `pb init`,
**I want to** get implement, groom, prioritize, architect, and discover,
**So that** the README matches what lands in my repo and agents can run the whole loop.

## Acceptance criteria

- [x] Given a fresh directory, when I run `pb init`, then `.claude/skills/` (or equivalent) contains all five skill files shipped in `skills/`
- [x] Given Cursor is detected, when I init, then `.cursor/rules/` still receives the Pilotbook rule
- [x] Given a re-run of `pb init`, when those files already exist, then they are skipped (current `write` behaviour) and not overwritten
- [x] Given a test in `test/ops.test.ts`, when init is asserted, then it fails if any of the five skills is missing

## Notes

Bug: `src/ops/init.ts` only copies `implement.md`. Highest value-to-effort item on this epic. Do this first.

## Out of scope

`pb instructions` on-demand serving (US-014). Rewriting skill bodies.

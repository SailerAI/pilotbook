---
id: US-036
title: Install the shape skill from pb init
type: story
epic: EPIC-007
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
tags: [init]
depends_on: [US-035]
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** consumer running `pb init`,
**I want to** get shape alongside the original five skills,
**So that** Cursor and Claude Code can slice epics without a hand-copied file.

## Acceptance criteria

- [x] Given a fresh directory, when I run `pb init`, then `.cursor/skills/shape/SKILL.md` and `.claude/skills/pilotbook-shape.md` exist (when those hosts are detected) and `SHIPPED_SKILLS` lists six names including `shape`
- [x] Given Cursor is detected, when I init, then the always-apply rule still lands and all six Cursor skills land
- [x] Given a re-run of `pb init`, when those files already exist, then they are skipped and not overwritten
- [x] Given a test in `test/ops.test.ts`, when init is asserted, then it fails if `shape` is missing

## Notes

Same copy layout as US-013 / US-031. Canonical body lives in `skills/shape.md`.

## Out of scope

`pb instructions` (US-014). Overwriting customized skills on re-init.

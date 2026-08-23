---
id: US-031
title: Install Cursor agent skills from pb init
type: story
epic: EPIC-005
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
tags: [init]
depends_on: [US-013]
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** consumer running `pb init` in Cursor,
**I want to** get implement, groom, prioritize, architect, and discover as Cursor agent skills,
**So that** Cursor loads the same workflows Claude already gets, not only the always-apply rule.

## Acceptance criteria

- [x] Given a fresh directory, when I run `pb init`, then `.cursor/skills/<name>/SKILL.md` exists for each of the five shipped skills
- [x] Given Cursor is detected, when I init, then `.cursor/rules/` still receives the Pilotbook rule and `.cursor/skills/` receives the five skills
- [x] Given a re-run of `pb init`, when those skill files already exist, then they are skipped and not overwritten
- [x] Given a test in `test/ops.test.ts`, when init is asserted, then it fails if any Cursor skill is missing

## Notes

US-013 copied skills into `.claude/skills/` and kept a Cursor **rule**. Cursor agent skills live at `.cursor/skills/<name>/SKILL.md` (directory + `SKILL.md`), which init did not write.

## Out of scope

Rewriting skill bodies. `pb instructions` on-demand serving (US-014). Claude's flat `.md` layout.

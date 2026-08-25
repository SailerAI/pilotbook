---
id: US-048
title: Route explore and ship from one instruction source
type: story
epic: EPIC-009
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [skills, init]
depends_on: [US-047]
business_rules: [BR-002]
adrs: [ADR-0002, ADR-0010]
created: 2026-08-25
updated: 2026-08-25
---

## Story

**As a** builder on Cursor or Claude Code,
**I want to** `pb instructions overview` to be the only explore/ship router,
**So that** both hosts attach discover→shape on a vague demand and implement on `pb next`, instead of drifted copies of the same paragraph.

## Acceptance criteria

- [x] Given `pb instructions overview --json`, when I read it, then the payload includes a `router` object with `explore` (vague demand → discover → shape) and `ship` (`pb next` → brief → verify) plus the skill list — not only a name/description table
- [x] Given `CURSOR_RULE` and `AGENTS_SNIPPET` in init, when they are installed, then they tell the agent to load `pb instructions overview` and follow that router; they do not inline a third copy of the numbered lists
- [x] Given this repo's `.cursor/rules/pilotbook.mdc` and `AGENTS.md`, when they are read, then they name the same router (this tree uses `pnpm pb`) and include shape

## Notes

Today `src/ops/init.ts` inlines the router, this repo's `.cursor/rules/pilotbook.mdc` omits shape, and `AGENTS.md` points at file links. One source. Init still writes short always-apply files — they must stay short and point at `pb instructions`.

## Out of scope

Adding MCP resources or prompts. Rewriting comparison docs. Skill body content (US-047).

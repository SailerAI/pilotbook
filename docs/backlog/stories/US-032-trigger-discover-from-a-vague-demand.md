---
id: US-032
title: Trigger discover from a vague demand
type: story
epic: EPIC-007
status: done
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [skills, discover]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** builder talking to Cursor or Claude Code,
**I want to** have the discover skill attach when I describe a new feature,
**So that** the agent researches an idea and promotes it instead of jumping to `pb next`.

## Acceptance criteria

- [x] Given the discover skill frontmatter, when Cursor or Claude Code ranks skills, then the description matches "I want to…", "new feature", "dashboard", "explore", "idea", and "epic", and states it is not for implementing an existing `TASK-` ID
- [x] Given the always-apply Cursor rule and `AGENTS.md` snippet shipped by `pb init`, when the user describes a vague demand, then they tell the agent to follow **discover** then **shape**; when the user is implementing existing work or ran `pb next`, then they tell the agent to follow **implement**
- [x] Given `skills/discover.md`, when an agent follows it, then the numbered protocol is: restate and ask 2–5 bounded questions if needed → `pb similar` / `pb search` → create or resume an idea → research (web, products, this repo) → fill the idea → `pb clarify` → `pb promote` or `pb reject` → immediately load **shape**. It never hand-edits `promoted_to`
- [x] Given this repo's always-apply rule and `AGENTS.md`, when they are read, then they name the same fork (this tree uses `pnpm pb`)

## Notes

EPIC-002 already shipped clarify / promote / reject. This story is the agent trigger and the research protocol, not new ops.

## Out of scope

The shape skill body (US-035). Idea template sections (US-033). Rewriting implement.

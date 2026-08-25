---
id: EPIC-009
title: Best-in-class agent experience
type: epic
status: done
priority: P1
estimate: 13
phase: 2
owner: unassigned
tags: [agents, skills, discover]
depends_on: []
related: [EPIC-007, IDEA-002, US-034, ADR-0009, ADR-0010, ADR-0011]
goal: A builder saying "I want X" in Cursor or Claude Code gets a maturity-calibrated interview, researched idea, shippable stories, and code-grounded tasks — not a 20-line checklist.
created: 2026-08-25
updated: 2026-08-25
---

## Outcome

Cursor and Claude Code follow one router. Discover, shape, architect, and implement are protocols: they read `pb profile`, interview with a question budget, fan out web / graph / code research, and hand off. `pb similar` exists. Ideas store prior art and evidence. Skill upgrades reach existing installs.

## Stories

- US-044 — Calibrate an agent from a derived repo profile
- US-045 — Ground a demand in existing code
- US-046 — Capture prior art and evidence on an idea
- US-047 — Rewrite shipped skills as calibrated protocols
- US-048 — Route explore and ship from one instruction source
- US-049 — Upgrade shipped skills on existing installs
- US-050 — Run selected operations with an exported LLM token
- US-034 — Find similar items and filter search by type (lives on EPIC-007; reopened — do not duplicate)

## Success metrics

- A greenfield repo and this repo produce different interview and research depth from the same skills
- `pb similar` and `pb search --type` run without "unknown command"
- A promoted idea without an evidence URL or internal ID is a lint warning
- `pb instructions overview` is the only routing source; Cursor and Claude Code behave the same
- Re-running init with an overwrite flag refreshes shipped skills that the user has not edited
- `pb generate discover` is optional (exported token); graph commands never call an LLM; coding agents remain the primary interface

---
id: US-047
title: Rewrite shipped skills as calibrated protocols
type: story
epic: EPIC-009
status: done
priority: P1
estimate: 8
phase: 2
owner: unassigned
tags: [skills]
depends_on: [US-034, US-044, US-045, US-046]
business_rules: [BR-003]
adrs: [ADR-0002, ADR-0009, ADR-0010]
created: 2026-08-25
updated: 2026-08-25
---

## Story

**As a** builder talking to Cursor or Claude Code,
**I want to** each shipped skill to be a protocol (calibrate, interview budget, research fan-out, handoff, stop conditions),
**So that** the agent guides discovery like a teammate instead of running a 20-line command list.

## Acceptance criteria

- [x] Given `skills/discover.md`, `shape.md`, `architect.md`, and `implement.md`, when an agent follows one, then it starts with `pb profile`, has an explicit question budget and stop condition, names parallel research (web, `pb similar`, `pb ground` / `pb search`), names the next skill and its entry condition, and has a `Do not` section — and every line can change the next action (BR-003)
- [x] Given `skills/groom.md` and `skills/prioritize.md`, when they are read, then they also calibrate from `pb profile` and keep their existing write constraints (no silent priority/status changes)
- [x] Given `pb skill <name>` and `pb init` copies, when they are loaded, then they match `skills/<name>.md` (no stale architect fork that omits `pb split`)

## Notes

Canonical source remains `skills/*.md`. Discover's research line must stop being a single sentence. Architect must search existing code via `pb ground` before proposing tasks. Shape must call `pb similar` (US-034) for real.

## Out of scope

The explore/ship router string (US-048). Skill upgrade overwrite (US-049). LLM-backed `pb generate` (US-050).

---
id: US-049
title: Upgrade shipped skills on existing installs
type: story
epic: EPIC-009
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [init, skills]
depends_on: [US-047]
business_rules: [BR-002]
adrs: [ADR-0001]
created: 2026-08-25
updated: 2026-08-25
---

## Story

**As a** builder who already ran `pb init`,
**I want to** refresh shipped skills when they have not been locally edited,
**So that** protocol upgrades reach my repo instead of `write()` skipping every existing file forever.

## Acceptance criteria

- [x] Given `pb init --refresh-skills`, when a destination skill still matches a previously shipped body (or is missing), then ops overwrite it from `skills/<name>.md`; when the file differs from every known shipped body, then ops skip it and list it under `skipped` with reason `edited`
- [x] Given `pnpm sync:skills` in this repo, when `.cursor/skills/<name>/SKILL.md` or `.claude/skills/pilotbook-<name>.md` drifts from `skills/<name>.md` (except the documented `pnpm pb` fork for implement), then a test fails
- [x] Given default `pb init` without `--refresh-skills`, when files already exist, then behaviour stays skip-if-exists

## Notes

Do not clobber a user who rewrote a skill. Hash or exact-byte compare against the current shipped file is enough for v1; no extra cache file required. `commit` under `.cursor/skills/` is not a shipped skill and must not be deleted.

## Out of scope

Auto-refresh on every `pb` invocation. Marketplace skills. Overwriting `AGENTS.md` body the user extended.

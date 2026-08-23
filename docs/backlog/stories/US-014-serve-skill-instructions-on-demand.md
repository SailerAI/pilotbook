---
id: US-014
title: Serve skill instructions on demand
type: story
epic: EPIC-005
status: backlog
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [instructions, ops]
depends_on: [US-013]
business_rules: []
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As an** agent,
**I want to** run `pb instructions` and `pb skill <name>`,
**So that** I load one workflow at a time instead of bloating `AGENTS.md` with five skill files.

## Acceptance criteria

- [ ] Given `pb instructions`, when I run it, then it lists the shipped skills with a one-line description (from skill frontmatter)
- [ ] Given `pb skill implement`, when I run it, then stdout is the skill body and `--json` includes `name`, `commands`, `writes`, `done`
- [ ] Given `AGENTS.md` after init, when I read it, then it tells the agent to run `pb instructions overview` (or `pb skill implement`) rather than inlining every skill
- [ ] Given CLI and MCP, when they serve a skill, then they read the packaged `skills/` files through ops

## Notes

Borrowed from `backlog instructions overview`. Progressive disclosure. Depends on US-013 so the files exist to serve.

## Out of scope

Generating per-agent slash commands. A skill marketplace.

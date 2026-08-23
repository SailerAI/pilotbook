---
id: US-003
title: Promote an idea along promoted_to
type: story
epic: EPIC-002
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
tags: [promote, ops]
depends_on: []
business_rules: [BR-001]
adrs: [ADR-0001]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** builder,
**I want to** run `pb promote IDEA-NNN --to epic|story`,
**So that** a researched idea becomes a real work item and `promoted_to` is set without hand-editing frontmatter.

## Acceptance criteria

- [x] Given an idea with `status: exploring` (or `raw` with impact/effort filled), when I run `pb promote IDEA-001 --to epic --title "..."`, then a new epic is allocated by `pb new` and the idea's `promoted_to` lists its ID
- [x] Given a successful promote, when I read the idea, then `status` is `promoted`
- [x] Given an idea missing impact, effort, or a filled Why section, when I promote, then ops refuse with a diagnostic and a `fix` command
- [x] Given `--dry-run`, when I promote, then no files are written and the plan names the type and title

## Notes

The `promoted_to` edge already exists in `builtinEdges()`. This is the smallest command in the funnel. `skills/discover.md` currently forbids promotion; update it to call `pb promote`.

## Out of scope

Clarifying first (US-002). Kill/reject (US-004).

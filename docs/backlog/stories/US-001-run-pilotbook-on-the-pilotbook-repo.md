---
id: US-001
title: Run Pilotbook on the Pilotbook repo
type: story
epic: EPIC-001
status: in-progress
priority: P1
estimate: 3
phase: 1
owner: unassigned
tags: [dogfood]
depends_on: []
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** contributor,
**I want to** manage this repo with the local Pilotbook CLI,
**So that** we feel default-config pain and agents load a real brief.

## Acceptance criteria

- [x] Given a fresh clone, when I run `pnpm build && pnpm pb lint`, then the graph exits 0
- [x] Given CONTRIBUTING, when I look up how to work, then `pnpm pb` vs `pnpm lint` is documented
- [x] Given the default Cursor rule in `src/ops/init.ts`, when an agent edits `src/`, then the rule still applies (or we have a tracked task to fix it)

## Notes

Product docs stay at `docs/*.md`. The graph only scans type dirs. Use `pnpm pb`, not `npx pilotbook`.

## Out of scope

Dumping the whole product roadmap. Custom `root` or extra task areas (`cli`, `core`). Overwriting shipped `templates/` or `skills/`.

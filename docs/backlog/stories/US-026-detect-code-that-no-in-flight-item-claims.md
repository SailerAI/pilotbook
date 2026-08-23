---
id: US-026
title: Detect code that no in-flight item claims
type: story
epic: EPIC-006
status: backlog
priority: P1
estimate: 5
phase: 3
owner: unassigned
tags: [drift, ops]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** run `pb drift` against a base ref,
**So that** changed paths with no in-progress or review item claiming their `code_map` key are visible without asking `pb analyze`.

## Acceptance criteria

- [ ] Given `code_map` and a git base ref (default `main`), when I run `pb drift`, then changed paths are mapped to `code_map` keys by prefix, and each key with no item in `in-progress` or `review` whose `area` or `tags` equals that key is reported
- [ ] Given `--json`, when I read the payload, then it includes `changed`, `keys`, `claimed` (`{key, ids}`), and `unclaimed` (keys with empty ids)
- [ ] Given unclaimed keys, when I run `pb drift` without `--json` in CI, then it exits non-zero
- [ ] Given a changed path that matches no `code_map` prefix, when I drift, then it is listed under an `unmapped` bucket — not silent, not an unclaimed key
- [ ] Given CLI and MCP, when they ask for drift, then they share ops

## Notes

Inverts the claim already used by the brief compiler (`src/core/brief.ts`: `key === area || tags.includes(key)`). No new schema. `pb analyze` finds gaps when you ask; this finds them when you don't. OpenSpec discussion #169 asked for this and it still does not exist there.

## Out of scope

CI and hook wiring (US-027). Creating items from unclaimed keys. Vector or semantic matching of paths.

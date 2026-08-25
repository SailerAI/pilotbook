---
id: US-040
title: Preview a sync before it writes
type: story
epic: EPIC-008
status: done
priority: P1
estimate: 3
phase: 3
owner: unassigned
tags: [interop, notion]
depends_on: [US-039]
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0008]
created: 2026-08-24
updated: 2026-08-24
---

## Story

**As a** builder,
**I want to** `pb sync --dry-run` to list create, update, skip, conflict, and intake actions,
**So that** I can see what would change before Notion or markdown is touched.

## Acceptance criteria

- [x] Given a graph and mocked Notion pages, when I run `pb sync --dry-run` (default both directions), then the report includes per-item `create` | `update` | `skip` | `conflict` | `intake` with id and side (`to` | `from`)
- [x] Given `--dry-run`, when it finishes, then no Notion HTTP write (POST/PATCH/DELETE) ran and no markdown file changed
- [x] Given `--json`, when I dry-run, then the same structured payload is emitted
- [x] Given CLI and MCP, when they dry-run, then they call the same ops function (ADR-0002)

## Notes

`--dry-run` defaults true for this command the same way `pb export` did, unless `--dry-run=false` is passed. `--to notion` / `--from notion` narrow the sides.

## Out of scope

Applying the plan. A UI diff view. Jira dry-run changes.

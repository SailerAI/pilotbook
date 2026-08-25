---
id: US-039
title: Push the graph without duplicating pages
type: story
epic: EPIC-008
status: done
priority: P1
estimate: 8
phase: 3
owner: unassigned
tags: [interop, notion]
depends_on: [US-038]
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0008]
created: 2026-08-24
updated: 2026-08-24
---

## Story

**As a** builder,
**I want to** `pb sync --to notion` to upsert every item by Pilotbook ID,
**So that** re-export updates the existing Notion row instead of creating a duplicate.

## Acceptance criteria

- [x] Given a provisioned workspace and an item with no matching Notion page, when I push, then ops create a page whose Pilotbook ID property equals the item id and cache the page id in `.pb/`
- [x] Given an item whose Pilotbook ID already exists in Notion, when I push again, then ops PATCH that page (title, status, tags, type-specific scalars, parent/depends_on/rule relations) and do not POST a second page
- [x] Given markdown body, when I push, then page children are replaced from the markdown (push-only; pull of body is out of scope)
- [x] Given the old `pb export --to notion` path, when I push, then it uses the same upsert op (no POST-always stub)
- [x] Given CLI and MCP, when they push, then they call the same ops function (ADR-0002)

## Notes

Identity is the Pilotbook ID rich_text property, queried per data source. Mapping file in `.pb/` is regenerable. `push_on_write` is opt-in in config and defaults false.

## Out of scope

Pull. Intake of Notion-only rows. Dry-run report (US-040). Jira. Two-way body.

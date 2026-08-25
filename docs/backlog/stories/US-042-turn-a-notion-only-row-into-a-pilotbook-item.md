---
id: US-042
title: Turn a Notion-only row into a Pilotbook item
type: story
epic: EPIC-008
status: done
priority: P1
estimate: 5
phase: 3
owner: unassigned
tags: [interop, notion]
depends_on: [US-039]
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0008]
created: 2026-08-24
updated: 2026-08-24
---

## Story

**As a** stakeholder who created a row in Notion,
**I want to** `pb sync --from notion` to allocate a real Pilotbook ID and write it back onto that page,
**So that** Notion-first work enters the graph without anyone inventing an ID.

## Acceptance criteria

- [x] Given a Notion page in a provisioned type database with an empty Pilotbook ID and a title, when I pull, then ops call `createItem` for that type, the new file exists, and the page's Pilotbook ID property is PATCHed to the allocated id
- [x] Given that intake, when I inspect the new item, then its `id` matches the type prefix/pad from config (BR-001) and was not taken from Notion
- [x] Given a Notion page whose title is blank, when I pull, then ops skip intake and report the skip rather than creating an untitled item
- [x] Given CLI and MCP, when they intake, then they call the same ops function (ADR-0002)

## Notes

Type comes from which database the row lives in, not a Type select. Parent relations may be applied after both sides have IDs; first intake can leave parent empty if the parent is also new.

## Out of scope

Inventing IDs in Notion. Pulling body as markdown. Changing an existing item's id. Creating types that are not in `config.types`.

---
id: US-043
title: Bind existing Notion databases from the board
type: story
epic: EPIC-008
status: done
priority: P1
estimate: 5
phase: 3
owner: unassigned
tags: [interop, notion, ui]
depends_on: [US-038]
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0008]
created: 2026-08-25
updated: 2026-08-25
---
## Story

**As a** builder whose Notion databases already live in different pages,
**I want to** map each Pilotbook type to an existing database from the board wizard,
**So that** I do not create a parent page or six new databases under Pilotbook.

## Acceptance criteria

- [x] Given `NOTION_TOKEN`, when I open the Notion wizard or run `pb sync --catalog`, then ops list searchable databases (id, title, data_source_id) and never require `parent_page_id`
- [x] Given six existing database ids or URLs, when I save the wizard or `pb sync --bind`, then config stores per-type `id` / `data_source_id` and Pilotbook does not POST `/databases`
- [x] Given a mapped database without a Pilotbook ID property, when I bind, then ops persist the mapping and report a warning — they do not PATCH the remote schema
- [x] Given CLI, MCP, and the board UI, when they catalog or bind, then they call the same ops (ADR-0002)
- [x] Given `pb sync --init` after bind, when I run it, then ops only retrieve and refresh stored ids — they do not create databases

## Notes

Token stays in the environment. Partial bind is allowed. `pb sync` without mappings errors with a pointer to the wizard.

## Out of scope

Creating Notion databases. Writing the token into yaml or the form. Auto-adding properties. Webhooks.

---
id: US-038
title: Provision Notion databases from Pilotbook
type: story
epic: EPIC-008
status: done
priority: P1
estimate: 5
phase: 3
owner: unassigned
tags: [interop, notion]
depends_on: []
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0008]
created: 2026-08-24
updated: 2026-08-24
---

## Story

**As a** builder connecting a Notion workspace,
**I want to** `pb sync --init` to create one database per Pilotbook type under a parent page and write the IDs into config,
**So that** I do not hand-build six schemas or invent database IDs.

## Acceptance criteria

- [x] Given `NOTION_TOKEN` and `interop.notion.parent_page_id`, when I run `pb sync --init`, then ops create six databases (epic, story, task, idea, adr, business-rule) under that page with the typed property schema (Name, Pilotbook ID, Status, Tags, plus type-specific fields and relations) and persist `id` / `data_source_id` in `pilotbook.config.yml`
- [x] Given a config that already lists all six databases, when I run `--init` again, then ops do not create duplicates and report the existing IDs
- [x] Given a missing token or parent page, when I run `--init`, then ops throw a `PilotbookError` naming the required env/config keys and write nothing
- [x] Given CLI and MCP, when they init, then they call the same ops function (ADR-0002)

## Notes

Notion API version `2025-09-03`. Tests mock `fetch`. Jira is untouched. Config `fileSchema` is strict, so `interop` must be added to Zod and `PilotbookConfig`.

## Out of scope

Pushing or pulling items. Hand-authored databases with a different schema. Webhooks. Storing page UUIDs in item frontmatter.

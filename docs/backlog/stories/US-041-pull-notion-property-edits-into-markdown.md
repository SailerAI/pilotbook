---
id: US-041
title: Pull Notion property edits into markdown
type: story
epic: EPIC-008
status: done
priority: P1
estimate: 8
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

**As a** stakeholder who changed status in Notion,
**I want to** `pb sync --from notion` to write those property edits through `updateItem`,
**So that** git still reviews the change and `pb lint` still applies.

## Acceptance criteria

- [x] Given a Notion page whose Pilotbook ID matches an item and whose bidirectional scalars (status, title, owner, priority, tags, estimate, phase) changed while local markdown did not, when I pull, then ops call `updateItem` with those fields and the file matches
- [x] Given both sides changed since the last push hash, when I pull, then Pilotbook wins, markdown is not clobbered, and the report lists a `conflict`
- [x] Given Notion page body or relation edits, when I pull, then those fields are skipped (body is push-only; edges stay markdown-owned)
- [x] Given an unknown status or enum from Notion, when I pull, then ops do not write an invalid field; lint stays clean
- [x] Given CLI and MCP, when they pull, then they call the same ops function (ADR-0002)

## Notes

Pull is never a daemon. Bidirectional scalars only. Identity, type, and edges always belong to markdown except intake (US-042).

## Out of scope

Webhooks. `push_on_write` (US-039). Intake of pages with no Pilotbook ID. Two-way body.

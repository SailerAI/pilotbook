---
id: US-008
title: Render a roadmap from phase
type: story
epic: EPIC-003
status: done
priority: P2
estimate: 3
phase: 2
owner: unassigned
tags: [ui, roadmap]
depends_on: []
business_rules: []
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** see epics, stories, and tasks laid out by `phase`,
**So that** the sequence of the product is visible without reading every file.

## Acceptance criteria

- [x] Given the UI, when I open the Roadmap tab, then items group by `phase` ascending, with epics as swimlanes and stories/tasks nested
- [x] Given `GET /api/items`, when the roadmap renders, then it does not recompute phase — it reads the field
- [x] Given an item with no `phase`, when I view the roadmap, then it lands in an "Unphased" column, not dropped
- [x] Given `pb board`, when regenerated, then a phase section appears in `BOARD.md` (or a linked file under `docs/backlog/`)

## Notes

`phase` is already a number on epic, story, and task. Nothing renders it today.

## Out of scope

Drag-to-rephase (nice follow-up). Gantt dates. `created`/`updated` as a timeline.

---
id: US-030
title: Navigate children and internal links from the peek
type: story
epic: EPIC-003
status: done
priority: P2
estimate: 3
phase: 2
owner: unassigned
tags: [ui, navigation]
depends_on: []
business_rules: []
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** builder,
**I want to** see an item's children in the peek and follow internal links,
**So that** I can drill epic → story → task without hunting the board.

## Acceptance criteria

- [x] Given I open an epic or story, when the peek renders, then immediate children appear as clickable rows (id, title, status)
- [x] Given I open a child or an internal link, when I click Back, then the previous item is restored
- [x] Given markdown or Brief HTML, when I click a bare item ID, an href containing an item ID, or a relative `.md` path that matches an item `rel`, then that item opens in the peek
- [x] Given an `https://` link, when I click it, then the browser follows it; non-item paths stay inert
- [x] Given ADR-0002, when the UI lists children, then it uses `schema.types[type].parent` and `/api/items` — it does not reimplement `explain()` or hardcode `epic` / `story`

## Notes

Complementary to US-008 (roadmap swimlanes). Children are a reverse lookup of the parent field already on each child. `schemaOf` must expose `parent`.

## Out of scope

Roadmap tab. Full descendant trees. `/api/explain`. Wiki `[[id]]` syntax.

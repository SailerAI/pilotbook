---
id: US-009
title: Search the graph from CLI and UI
type: story
epic: EPIC-003
status: done
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [search, ops, ui]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** `pb search "authentication"` and type the same query in the UI,
**So that** I can find IDs, titles, and body hits without grepping the repo by hand.

## Acceptance criteria

- [x] Given a query, when I run `pb search <q> --json`, then results are `{type, id, title, path, snippet}` ranked by id/title match then body, across all item types
- [x] Given `GET /api/search?q=`, when the UI search box fires, then it calls that endpoint (not a client-side id/title filter only)
- [x] Given ADR-0001, when search runs, then it reads markdown on disk (or the existing `.pb` mtime cache) and does not introduce a required SQLite or vector store
- [x] Given an empty query, when I search, then ops return no hits and do not dump the graph

## Notes

Borrowed from `backlog search --json`. Honest first step toward retrieval. A derived index is allowed if regenerable and gitignored, same as `.pb/index.json`.

## Out of scope

Embeddings, vector DBs, cross-repo search. Those stay deferred until this is not enough.

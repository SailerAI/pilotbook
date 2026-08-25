---
id: US-034
title: Find similar items and filter search by type
type: story
epic: EPIC-007
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [search, ops]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002]
created: 2026-08-23
updated: 2026-08-25
---
## Story

**As an** agent exploring a demand,
**I want to** rank existing items by token overlap and restrict search to types,
**So that** I resume a live idea or epic instead of duplicating it.

## Acceptance criteria

- [x] Given a query, when I run `pb similar <q> --json`, then ops return `{ type, id, title, path, score, snippet }` ranked by title-then-body token overlap over the markdown index — no SQLite, no embeddings
- [x] Given an empty or whitespace query, when I run similar, then the result is `[]`
- [x] Given `pb search <q> --type idea,epic,story`, when hits exist, then only those types are returned; unknown types refuse with a `fix`
- [x] Given CLI and MCP, when they similar/search, then they call the same ops functions (ADR-0002). No new REST route for similar; search `--type` may be a query param on the existing `/api/search`

## Notes

Reopened 2026-08-25: marked `done` but `src/` has no `similar` function and `searchGraph` has no `--type`. Tokenize on non-alphanumerics, drop short tokens and a small stopword list. Score title overlap higher than body. `related:` is already a non-blocking edge — discover/shape write it; this story does not add a new edge kind. Related: EPIC-009.

## Out of scope

Semantic search. LLM duplicate detection. A similar UI. A `children` alias for `pb explain`.

---
id: TASK-021
title: Search ops, CLI, MCP, REST
type: task
story: US-009
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [search, ops]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 7290b35ab37f }
---
## Scope

`searchGraph(ctx, q)` over the loaded index (`.pb/index.json` already has `body`). Rank id/title hits before body; return `{ type, id, title, path, snippet }`. Empty/whitespace query → `[]`. Wire `pb search`, MCP `search`, `GET /api/search?q=`. No SQLite or embeddings (ADR-0001).

## Steps

- [x] Implement `searchGraph` over the markdown index; snippet is a short body excerpt around the first match (or title if id/title hit)
- [x] Rank id/title matches before body; empty/whitespace query returns `[]`
- [x] Wire CLI `pb search`, MCP `search`, `GET /api/search?q=`, and completions
- [x] Tests for rank, empty query, and REST adapter

## Verification

`pnpm test` covers `searchGraph`. Empty query returns no hits. CLI, MCP, and REST call the same ops function. No required SQLite or vector store.

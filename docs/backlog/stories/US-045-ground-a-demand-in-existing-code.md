---
id: US-045
title: Ground a demand in existing code
type: story
epic: EPIC-009
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [agents, ops, search]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0002]
created: 2026-08-25
updated: 2026-08-25
---

## Story

**As an** agent researching or architecting a demand,
**I want to** `pb ground <q>` to map the demand onto `codeMap` paths and live graph items,
**So that** I reuse an existing implementation instead of specifying a duplicate.

## Acceptance criteria

- [x] Given `code_map` keys and a query, when I run `pb ground <q> --json`, then ops return `{ query, areas: [{ key, paths, hits }], items: [{ type, id, title, score, snippet }], unmapped }` where `areas` are `codeMap` keys whose key or path tokens overlap the query, and `items` are token-overlap hits from the markdown index (same tokenizer as `pb similar`)
- [x] Given an empty `code_map` and a non-empty graph, when I ground, then `areas` is `[]`, `unmapped` is true, and `items` still rank graph hits — no error
- [x] Given CLI and MCP, when they ground, then they call the same ops function (ADR-0002)

## Notes

Reuse `distinctCodeMapAreas` path matching from `src/ops/split.ts`. Do not walk the whole tree listing files; emit path prefixes from config (BR-003). Empty query → `{ areas: [], items: [], unmapped: true }`.

## Out of scope

Embeddings. Opening or reading source files. Changing `pb brief`'s code_map section. `pb drift` (US-026).

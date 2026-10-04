---
id: BR-001
title: IDs are allocated by pb new
type: business-rule
status: active
domain: identity
version: 2
content_hash: d7549be88463
related: []
tags: [ids]
created: 2026-08-23
updated: 2026-10-04
amended: 2026-10-04
---
## Rule

Work-item IDs MUST be allocated by `pb new` (or `pnpm pb new` in this repo). Agents MUST NOT invent IDs, reuse an ID, or hand-write a new filename.

`pb new` allocates `{prefix}` plus 6 Crockford base32 characters, uppercase, with no I, L, O, or U. Example: `US-K7M2QP`. IDs already in the graph that are `{prefix}` plus zero-padded digits stay valid. Do not renumber them.

## Examples

### Allocate a task

Given a story `US-001`, when creating work, then run `pnpm pb new task --story US-001 --title "..." --area backend` and use the ID it prints.

## Edge cases

- Editing an existing file's title or body is allowed; changing its `id` is not.
- Test fixtures under `test/fixtures/` may use their own IDs; they are not this project's graph.
- Two branches allocating at the same time receive different IDs. Do not pick the next number by hand.

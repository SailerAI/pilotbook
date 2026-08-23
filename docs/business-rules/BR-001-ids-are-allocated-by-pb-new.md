---
id: BR-001
title: IDs are allocated by pb new
type: business-rule
status: active
domain: identity
version: 1
related: []
tags: [ids]
created: 2026-08-23
updated: 2026-08-23
---
## Rule

Work-item IDs MUST be allocated by `pb new` (or `pnpm pb new` in this repo). Agents MUST NOT invent IDs, skip a number, or hand-write a new prefix+pad filename.

## Examples

### Allocate a task

Given a story `US-001`, when creating work, then run `pnpm pb new task --story US-001 --title "..." --area backend` and use the ID it prints.

## Edge cases

- Editing an existing file's title or body is allowed; changing its `id` is not.
- Test fixtures under `test/fixtures/` may use their own IDs; they are not this project's graph.

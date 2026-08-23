---
id: BR-002
title: Lint and serialize are binding
type: business-rule
status: active
domain: integrity
version: 1
content_hash: 179b81ff4e7f
related: []
tags: [lint]
created: 2026-08-23
updated: 2026-08-23
---
## Rule

`pb lint` MUST exit 0 before a change is finished. Parse-then-serialize of an unchanged item MUST be byte-identical (LF). CRLF files are accepted on read and written back as LF.

## Examples

### Finish a task

Given an in-progress task, when implementation is complete, then `pnpm pb lint` exits 0 and the item file still round-trips.

## Edge cases

- `pnpm lint` is Biome (source style). It does not replace `pnpm pb lint` (graph integrity).
- Dangling refs, cycles, wrong-type edges, and unknown fields are errors, not warnings to ignore.

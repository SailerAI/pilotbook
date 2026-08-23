---
id: ADR-0004
title: Tasks may exist without a story parent
type: adr
status: accepted
version: 1
date: 2026-08-23
deciders: [maintainers]
tags: [schema, routing]
supersedes: []
superseded_by: []
content_hash: 74d5b1a6514a
created: 2026-08-23
updated: 2026-08-23
---
## Context

Today `task` requires a `story` parent (`src/core/defaults.ts`, `src/ops/items.ts` `assertRefs`). Scale-adaptive routing — BMAD's "small changes go straight to build" — needs a one-line typo fix to be a task without inventing an epic and a story. That change touches parent handling in lint, brief, board, and `pb next`.

## Decision

`story` on a task is optional. A parentless task is a first-class work item: `pb next` can hand it out, `pb brief` compiles from the task plus any `business_rules` / `adrs` / `depends_on` it carries, and lint does not demand a parent.

Parentless is for small work. Missing parent is a warning on `estimate >= 3` or `priority: P0`, not an error. If that warning is ignored in practice, promote it to an error later; do not add a second type.

This decision unblocks US-012. Scale-adaptive routing MUST NOT invent a `chore` type or an `--orphan` flag.

## Consequences

- `createItem` stops throwing when `story` is omitted for type `task`.
- Lint: missing parent is a warning on `estimate >= 3` or `priority: P0`, not an error.
- Brief: no parent section; authority order still rules → ADRs → target → depends_on.
- Board: parentless tasks appear under an "Ungrouped" bucket, not a fake story.
- `pb split` of a parentless task may create a story if complexity scoring says so.

## Alternatives considered

- Keep the required parent and auto-create a throwaway story — pollutes the graph and fights "small changes go straight to build".
- Add a `chore` type — a second work item that `pb next` and verify must special-case.
- Allow parentless tasks only with `--orphan` — a flag agents will forget.

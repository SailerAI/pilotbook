---
id: ADR-GZ7QNJ
title: Allocate collision-resistant ids and keep the board local
type: adr
status: accepted
version: 1
date: 2026-10-04
deciders: [maintainers]
tags: [git, ids]
supersedes: []
superseded_by: []
content_hash: 1af389cf940b
created: 2026-10-04
updated: 2026-10-04
---
## Context

`pb new` used to allocate `{prefix}` plus `max(existing) + 1`. Two branches cut from the same commit both minted `US-074` (and the same for `TASK-` and `EPIC-`). Git merged the two files when the slugs differed, then lint failed `duplicate-id`. The same slug was a content conflict.

Every create, update, verify, bump, and delete also rewrote `BOARD.md`, and the implement skill told agents to commit it. That file is one sorted projection of the whole graph plus a generation date, so any two branches that touched any item conflicted on it. Item files are the source of truth ([ADR-0001](ADR-0001-markdown-is-the-only-source-of-truth.md)). The board is not.

## Decision

`pb new` allocates `{prefix}` plus 6 Crockford base32 characters, uppercase, excluding I, L, O, and U. Example: `US-K7M2QP`. The allocator retries when the id is already in the graph or the body is all digits. Existing padded ids stay valid. `pad` only checks those legacy ids. Do not renumber them.

`BOARD.md` stays a local projection. `pb init` appends its configured path to `.gitignore`. Agents commit item files and leave the board untracked. `pb lint` warns `board-not-ignored` when that path is missing from `.gitignore`. Warnings do not fail lint.

## Consequences

- Parallel `pb new` no longer collides. A fresh clone has no `BOARD.md` until `pb board` or a write.
- A repo that already tracks the board must `git rm --cached` that path once. Gitignore does not untrack a file.
- Briefs, filenames, and Notion identity use whatever id `pb new` printed, including ids that are not numbers.
- `converge` keeps the id it planned and passes it into `createItem`, so the write lands on the path it reserved.

## Alternatives considered

- Keep sequential numbers and renumber the branch before merge — the pull request still changes ids after review.
- Regenerate `BOARD.md` with a merge driver — the driver runs before the rest of the tree is merged, so it cannot see the item files.
- Commit the board only from CI on the default branch — two merges still race on that file.

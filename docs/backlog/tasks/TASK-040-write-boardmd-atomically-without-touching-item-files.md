---
id: TASK-040
title: Write BOARD.md atomically without touching item files
type: task
story: US-020
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: []
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: bf5e29b316a9 }
---
## Scope

Add `writeFileAtomic` to `FileSystem` and use it in `writeBoard` so a failed serialize leaves the previous `BOARD.md` in place. Lock in that `writeBoard` never writes item files (status, custom keys, HTML comments).

## Steps

- [x] Add `writeFileAtomic` to `FileSystem`; `NodeFileSystem` writes a sibling temp file then `fs.renameSync`; `MemoryFileSystem` writes directly
- [x] Call `writeFileAtomic` from `writeBoard`
- [x] Tests: item files unchanged after regenerate; thrown atomic write keeps the previous board

## Verification

`pnpm test` covers the lock-in and atomic-failure cases. `pnpm typecheck` and `pnpm lint` are clean.

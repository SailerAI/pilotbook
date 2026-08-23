---
id: TASK-037
title: Point init AGENTS.md at pb instructions overview
type: task
story: US-014
status: done
priority: P1
estimate: 1
phase: 2
owner: unassigned
area: docs
tags: [instructions, init]
depends_on: [TASK-035]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: c19a738e5151 }
---
## Scope

Change `AGENTS_SNIPPET` in `src/ops/init.ts` so a **fresh** `AGENTS.md` tells the agent to run `pb instructions overview` (or `pb skill implement`) instead of inlining skill files. Do not rewrite this repo’s existing `AGENTS.md` (init skips files that already mention Pilotbook).

## Steps

- [x] Update `AGENTS_SNIPPET`
- [x] Assert fresh `initProject` `AGENTS.md` mentions `pb instructions overview` and does not list every skill path

## Verification

A new `initProject` writes an `AGENTS.md` that names `pb instructions overview`. Re-init still skips an existing Pilotbook `AGENTS.md`.

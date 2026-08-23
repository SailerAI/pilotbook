---
id: TASK-001
title: Document the dogfood loop in CONTRIBUTING
type: task
story: US-001
status: done
priority: P1
estimate: 2
phase: 1
owner: unassigned
area: docs
tags: [dogfood]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 701b4cca1cc3 }
---
## Scope

Tell contributors this repo is a Pilotbook project: `pnpm lint` is Biome, `pnpm pb lint` is the graph, and daily work uses `pnpm pb next` / `pnpm pb brief`.

## Steps

- [x] Add a Pilotbook section to CONTRIBUTING.md
- [x] Run `pnpm pb lint --format github` in CI after `pnpm build`

## Verification

CONTRIBUTING mentions both linters. CI runs graph lint after the CLI is built.

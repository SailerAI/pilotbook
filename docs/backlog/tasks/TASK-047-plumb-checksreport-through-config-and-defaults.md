---
id: TASK-047
title: Plumb checks.report through config and defaults
type: task
story: US-023
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [verify, config]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-023#1"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 4a00ffc25c7d }
---
## Scope

Add the optional `checks.report` config key, a repo-relative path to a JUnit XML report, following the way `hooks.prime_budget` was threaded.

## Steps

- [x] `PilotbookConfig.checks` gains `report?: string` in `src/core/types.ts`
- [x] `fileSchema.checks` gains `report: z.string().optional()` and the merge in `parseConfigFile` carries it
- [x] `dumpDefaultConfig` documents the key as a commented example so `pb init` does not point a fresh project at a report it never writes
- [x] Export `parseJUnit` and `TestResult` from `src/core/index.ts`

## Verification

`pnpm test` exercises the key through `dumpDefaultConfig().replace(...)` in the `verify report` suite; the commented default keeps every seeded test project unchanged. `pnpm typecheck` and `pnpm exec biome check .` are clean.

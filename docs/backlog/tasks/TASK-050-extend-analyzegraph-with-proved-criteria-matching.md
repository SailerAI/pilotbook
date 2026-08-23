---
id: TASK-050
title: Extend analyzeGraph with proved criteria matching
type: task
story: US-024
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [analyze, criteria]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-004]
adrs: [ADR-0003, ADR-0006]
covers: ["US-024#2", "US-024#3", "US-024#4"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 79b58b06af58 }
---
## Scope

Add `proved` / `test` on `CoverageRow` and `proved` / `unproven` / `provedPercent` on `AnalyzeReport`. `analyzeGraph` reads `checks.report` via `ctx.fs` and `parseJUnit`, matching the exact token `ID#N` in `classname + " " + name`. Do not change `ok` or `coveragePercent`.

## Steps

- [x] Extend `CoverageRow` with `proved` and optional `test`; extend `AnalyzeReport` with `provedPercent`, `proved`, and `unproven`
- [x] Index JUnit results by `COVERS_RE` tokens found in `classname + " " + name`; a criterion is proved only when the match `status === "pass"`
- [x] Count `provedPercent` over criterion rows only; rule/ADR rows stay `proved: false` with a not-machine-ownable note
- [x] Keep `ok` and `coveragePercent` semantics unchanged (US-015)

## Verification

`pnpm test` covers a passing bound token, fail/error/skipped/missing matches, that `US-024#20` does not prove `US-024#2`, and that `ok` / `coveragePercent` are unchanged when criteria are unproven.

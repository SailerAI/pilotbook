---
id: TASK-042
title: Implement analyzeGraph coverage queries
type: task
story: US-015
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [analyze]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-002]
adrs: [ADR-0003, ADR-0007]
covers: ["US-015#1", "US-015#2"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: ffba77db33b0 }
---
## Scope

Add `analyzeGraph(ctx)` in `src/ops/analyze.ts`. Four pure graph queries: uncovered active rules, uncovered accepted ADRs, done stories with open child tasks, and criteria with no covering `covers` token. JSON shape is `coverage` plus `coveragePercent`.

## Steps

- [x] Export `AnalyzeReport` with `coverage: { key, hasTask, taskIds, notes }[]`, `coveragePercent`, and `ok`
- [x] Active BRs via `inboundOf(index, id, ["business_rules"])`; accepted ADRs via `["adrs"]`
- [x] Done stories with child tasks not `done`/`cancelled`
- [x] Criteria from `parseChecklist(extractSection(body, "Acceptance criteria"))` crossed with `covers` `ID#N` tokens; skip `isTemplateCriterion`

## Verification

`pnpm test` covers the four checks, `coveragePercent`, and that uncovered criteria appear without failing `ok`. `pnpm typecheck` and `pnpm lint` are clean.

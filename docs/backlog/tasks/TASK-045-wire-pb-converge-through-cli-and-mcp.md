---
id: TASK-045
title: Wire pb converge through CLI and MCP
type: task
story: US-016
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [converge]
depends_on: [TASK-044]
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-001]
adrs: [ADR-0007]
covers: ["US-016#1"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 7eabeeeded17 }
---
## Scope

Expose `convergeItem` through `pb converge <ID>`, MCP `converge`, and command completion. `--dry-run` prints `converged` or the plan. README command tables include `analyze` and `converge`.

## Steps

- [x] Export from `src/ops/index.ts`
- [x] `defineCommand` `converge` in `src/cli/index.ts` with `--dry-run` and `--json`
- [x] TOOLS + `callTool` case in `src/mcp/index.ts`
- [x] Add `converge` to `src/ops/complete.ts` and README command tables

## Verification

`pnpm test` asserts `complete` offers `converge`. `pnpm typecheck` and `pnpm lint` are clean. `pnpm pb lint` exits 0 after verify.

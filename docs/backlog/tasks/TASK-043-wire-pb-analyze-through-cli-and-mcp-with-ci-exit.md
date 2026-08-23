---
id: TASK-043
title: Wire pb analyze through CLI and MCP with CI exit
type: task
story: US-015
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [analyze]
depends_on: [TASK-042]
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-015#3", "US-015#4"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 930a6ed750b3 }
---
## Scope

Expose `analyzeGraph` through `pb analyze`, MCP `analyze`, and command completion. The CLI prints a coverage table, `--json` emits the payload, and the process exits 1 when uncovered active rules or done-with-open-children exist. Do not re-report dangling-ref, cycle, or unknown-field.

## Steps

- [x] Export from `src/ops/index.ts`
- [x] `defineCommand` `analyze` in `src/cli/index.ts` with `--json` and `process.exit(ok ? 0 : 1)`
- [x] TOOLS + `callTool` case in `src/mcp/index.ts`
- [x] Add `analyze` to `src/ops/complete.ts`

## Verification

`pnpm test` asserts `ok` is false only for uncovered active rules and done-with-open-children, and that lint still owns dangling/cycle/unknown-field. `pnpm typecheck` and `pnpm lint` are clean.

---
id: TASK-048
title: Return parsed per-test results from verifyItem
type: task
story: US-023
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [verify, junit]
depends_on: [TASK-046, TASK-047]
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-023#2", "US-023#3", "US-023#4"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: c8664a03b53e }
---
## Scope

Read `checks.report` in `verifyItem` after the command loop and add `results` and `reportStale` to `VerifyResult`. `stdio`, `shell: false`, and the `verified` frontmatter shape are untouched.

## Steps

- [x] Capture `ctx.fs.stat(reportAbs)?.mtimeMs` before the command loop
- [x] After the loop, parse the report through `parseJUnit` when it is a file; otherwise `results` is `[]`
- [x] Set `reportStale` when the report existed and no command rewrote it
- [x] Leave the CLI and MCP transports alone — both already emit the whole envelope, so neither parses XML

## Verification

`pnpm test` covers a parsed report, an absent report, an unconfigured report, a stale report, and a corrupt report — each asserting `ok` and the existing exit-code path are unchanged. `pb verify <ID> --json` shows the `results` array end to end.

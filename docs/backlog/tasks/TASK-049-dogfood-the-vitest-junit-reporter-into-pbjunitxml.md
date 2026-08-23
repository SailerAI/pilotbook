---
id: TASK-049
title: Dogfood the vitest junit reporter into .pb/junit.xml
type: task
story: US-023
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [verify, junit]
depends_on: [TASK-048]
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-002]
adrs: [ADR-0002]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 50eb06415555 }
---
## Scope

Make this repo produce the report it now reads, so `pb verify` on Pilotbook itself returns per-test results.

## Steps

- [x] `vitest.config.ts` reporters become `["default", ["junit", { outputFile: ".pb/junit.xml" }]]`
- [x] `pilotbook.config.yml` sets `checks.report: .pb/junit.xml`
- [x] Confirm `.pb` is already gitignored so the report never enters git
- [x] Confirm the default reporter still prints and `pnpm test` exit codes are unchanged

## Verification

`pnpm test` writes `.pb/junit.xml` alongside its normal console output and still exits 0 on success and non-zero on failure. `pb verify <ID> --json` then reports 150+ parsed tests with `reportStale: false`.

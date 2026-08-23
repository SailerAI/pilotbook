---
id: TASK-051
title: Title tests with US-023 and US-024 criterion tokens
type: task
story: US-024
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [analyze, tests]
depends_on: [TASK-050]
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-004]
adrs: [ADR-0006]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: f461e1e7a23d }
---
## Scope

Title the new US-024 tests with `US-024#N` tokens and add `US-023#N` tokens to the US-023 tests in `test/junit.test.ts` and the verify-report suite. Do not retrofit the existing ~140 unrelated tests.

## Steps

- [x] Prefix US-023 parser tests with `US-023#1` and verify-report tests with `US-023#2` / `#3` / `#4`
- [x] Title new analyze proof tests `US-024#1` … `US-024#4` so the next `pb analyze` run can prove those criteria
- [x] Leave unrelated existing test titles unchanged

## Verification

`pnpm test` still passes. After a suite run, `pnpm pb analyze --json` lists at least one US-023 or US-024 criterion in `proved`.

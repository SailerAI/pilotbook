---
id: TASK-052
title: Add Proved and Test columns to pb analyze table and README
type: task
story: US-024
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: docs
tags: [analyze, docs]
depends_on: [TASK-050]
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-004]
adrs: [ADR-0002]
covers: ["US-024#1"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 72e0915ddd12 }
---
## Scope

Add `Proved?` and `Test` columns to the human `pb analyze` table for criterion rows. Document the new JSON fields (`proved`, `unproven`, `provedPercent`) and the analyze row in README. The CLI still does no XML parsing.

## Steps

- [x] Print `Proved?` / `Test` for criterion keys (`ID#N`); leave those cells blank on rule, ADR, and done-with-open-children rows
- [x] Include `provedPercent` in the human summary next to `coveragePercent`
- [x] Update the `pb analyze` README row and document `proved` / `unproven` / `provedPercent`

## Verification

`pnpm pb analyze --json` includes the new fields. The text table headers include `Proved?` and `Test`. README mentions them.

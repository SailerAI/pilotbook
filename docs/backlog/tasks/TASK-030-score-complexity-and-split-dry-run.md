---
id: TASK-030
title: Score complexity and split dry-run
type: task
story: US-010
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [split, ops]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 01a37324743f }
---
## Scope

New `src/ops/split.ts` holding `scoreComplexity` and `splitItem(id, { dryRun: true })`. The score is the deterministic formula in the US-010 notes — no LLM anywhere. A dry run writes nothing and returns a plan carrying `recommended_count` plus placeholder child titles the agent may edit.

## Steps

- [x] `scoreComplexity(item)`: `criterion_count` from `parseChecklist` in `src/core/checklist.ts` (ADR-0003), `linked_rule_count` as `business_rules.length + adrs.length`, `distinct_code_map_areas` from config `codeMap` keys whose path prefixes appear in the body, else tags matching those keys, else `1`
- [x] `score = criterion_count + linked_rule_count + distinct_code_map_areas` and `recommended_count = max(2, criterion_count, distinct_code_map_areas)`
- [x] `splitItem(id, { dryRun: true })` returns the plan and writes no files
- [x] Refuse with `{ error, code, fix }` when `already_small` (`type == task` and `area` set and `criterion_count <= 1`) or `recommended_count <= 1`
- [x] Tests: score on a real story, refusal on an already-small task, and a dry run that touches no files

## Verification

`pnpm pb split US-010 --dry-run` prints a plan with a recommended count while `git status` stays clean; splitting a one-criterion task with an `area` refuses with a fix that says it is already small.

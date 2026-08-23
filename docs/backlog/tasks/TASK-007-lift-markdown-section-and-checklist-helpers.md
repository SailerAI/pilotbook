---
id: TASK-007
title: Lift markdown section and checklist helpers
type: task
story: US-002
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [clarify, markdown]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 3cab55a0d06e }
---
## Scope

Shared markdown helpers for clarify (and later analyze/verify): heading slice/upsert and ADR-0003 checklist parse/serialize. A prose section is not silently rewritten.

## Steps

- [x] Lift `extractSection` / add `upsertSection` in `src/core/markdown.ts`
- [x] Add `src/core/checklist.ts` for `- [ ]` / `- [x]` under `## Acceptance criteria`
- [x] Point `brief.ts` at the shared extractor

## Verification

Helpers round-trip a checklist and leave a prose Acceptance criteria section untouched. Brief still extracts Outcome/criteria.

---
id: TASK-025
title: Make story optional on a task
type: task
story: US-012
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [schema, routing]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: f02b2fa892d7 }
---
## Scope

Make `story` optional on `task` (ADR-0004) without breaking the field allowlist. Watch the trap: `unknown-field` in `src/core/lint.ts` allows only `cfg.required` plus `cfg.objects`, so simply deleting `story` from the task `required` list in `src/core/defaults.ts` makes every existing task report `unknown field "story"`. Add an `optional` key list to `TypeConfig`, move task `story` there, and add `business_rules` / `adrs` alongside it. Keep the change per type — ADR-0004 makes only *task* parents optional, not story `epic`.

## Steps

- [x] Add `optional: string[]` to `TypeConfig` (`src/core/types.ts`) and `typeCfg` (`src/core/defaults.ts`); move task `story` from `required` to `optional`; add `business_rules` and `adrs` to task `optional` and to `arrays`
- [x] Teach the `unknown-field` check in `src/core/lint.ts` to accept `cfg.optional`; keep `serializeItem` key order as required, then optional, then objects, so parse-then-serialize stays byte-identical (BR-002)
- [x] Let `assertRefs` in `src/ops/items.ts` skip an absent `cfg.parent` when the type marks it optional instead of throwing `tasks require story`; still validate the ref and its type when present
- [x] Stop substituting `US-000` for a missing `story` in `createItem` template vars, and omit an empty parent key from the serialized YAML entirely
- [x] Add a lint **warning** (never an error) when a task has no `story` and `estimate >= 3` or `priority: P0`
- [x] Tests: parentless create, `brief` and `next` on a parentless task, serialize round-trip, the estimate/P0 warning, and no `unknown-field` on parented tasks

## Verification

`pnpm pb new task --title "Fix typo in README" --area docs` (no `--story`) creates a task with no `story` key at all, `pnpm pb lint` exits 0 across all existing tasks, `pnpm pb brief TASK-NNN` and `pnpm pb next` both include it, and a parentless `estimate: 5` task yields exactly one warning.

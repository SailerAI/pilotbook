---
id: TASK-029
title: Inbound edges and pb impact across CLI and MCP
type: task
story: US-011
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [impact, graph]
depends_on: [TASK-027]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 3cff40470d82 }
---
## Scope

Add `inboundOf` next to `refsOf` in `src/core/graph.ts` — `deleteItem` already scans inbound edges ad hoc, so fold that duplication onto the shared helper. `impactOf(id)` returns every story and task with an inbound `business_rules` / `adrs` edge to the target, reports the target's current `version`, and flags entries with `status: done` as shipped against the previous version. It is a report: no status is ever written. The command is `pb impact <ID>` with MCP `impact`; `pb analyze --impact` belongs to US-015 and is out of scope.

## Steps

- [x] `inboundOf(index, id, fields?)` in `src/core/graph.ts`; refactor `deleteItem`'s ad-hoc inbound scan onto it
- [x] `impactOf(id)` in ops: inbound `business_rules` / `adrs` only, carrying the target's `version` and a `done` flag per entry
- [x] Refuse with `{ error, code, fix }` when the id is not a business rule or an ADR
- [x] Wire CLI `pb impact`, MCP `impact`, and completions (ADR-0002); no REST route
- [x] Tests: inbound list contents, the `done` flag, and that the op writes no files

## Verification

`pnpm pb impact BR-001` lists the inbound stories and tasks with the `done` ones flagged and the rule's current `version`; `git status` is unchanged after the run.

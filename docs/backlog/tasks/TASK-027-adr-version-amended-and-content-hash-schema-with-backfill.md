---
id: TASK-027
title: ADR version amended and content_hash schema with backfill
type: task
story: US-011
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [schema, impact]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 399716bf8c5f }
---
## Scope

Schema and backfill only. In `src/core/defaults.ts`, give `adr` a `version` (number, default 1), an optional `amended` date, and `content_hash`; give `business-rule` a `content_hash`. Update `templates/adr.md` and `templates/business-rule.md`. Backfill every existing ADR and business rule with the hash of its current body, leaving `version: 1` — a backfill is not an amendment (ADR-0005 Consequences). No lint rule and no `pb bump` here; those are TASK-028.

## Steps

- [x] `adr` type: add `version` to the key list and to `numbers` (default 1 on create), `amended` to `dates` as an optional key, and `content_hash` as a known key
- [x] `business-rule` type: add `content_hash` as a known key next to the existing `version`
- [x] `templates/adr.md` gains `version: 1`; both `templates/adr.md` and `templates/business-rule.md` gain `content_hash`
- [x] Backfill `docs/adr/*.md` and `docs/business-rules/*.md` with the current body hash without incrementing `version`
- [x] Tests: `version` defaults to 1 on `pb new adr`, and a parse-then-serialize round-trip of a backfilled file is byte-identical (BR-002)

## Verification

`pnpm pb lint` exits 0, every ADR and business rule carries a `content_hash` with `version: 1`, and `pnpm pb new adr --title "..."` writes `version: 1` plus a `content_hash`.

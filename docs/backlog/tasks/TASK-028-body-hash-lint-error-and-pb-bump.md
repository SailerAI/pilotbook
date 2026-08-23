---
id: TASK-028
title: Body hash lint error and pb bump
type: task
story: US-011
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [impact, lint]
depends_on: [TASK-027]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 8bcaef979af7 }
---
## Scope

Add `bodyHash(body)` beside `contentHash` in `src/core/hash.ts` — sha256 of the markdown body only, truncated to 12 hex characters. Do not overload `verified.hash`, and exclude `content_hash` from every other hash input so the field cannot chase itself. Lint errors when an `active` business rule or an `accepted` ADR has a body hash that differs from its stored `content_hash`, carrying `pb bump <ID>` as the fix. Add `bumpItem` in ops plus the CLI and MCP surface. Lint stays a pure function of the files and never calls git (ADR-0001).

## Steps

- [x] `bodyHash(body)` in `src/core/hash.ts`; exclude `content_hash` from `contentHash` inputs
- [x] Lint error (`stale-content-hash`) in `src/core/lint.ts` for active BR / accepted ADR drift, with suggestion and `fix` of `pb bump <ID>`
- [x] `bumpItem(id)` in ops: increment `version`, set `amended` to today, refresh `content_hash`
- [x] No-op path: when the body hash already equals `content_hash`, warn, write nothing, and imply no impact — same refusal shape as `promoteIdea` (`{ error, code, fix }`)
- [x] Wire CLI `pb bump`, MCP `bump`, and completions; transports only render (ADR-0002)
- [x] Tests: drift is an error, a real bump clears it, and a second bump warns without writing

## Verification

Editing an accepted ADR body makes `pnpm pb lint` fail with a `pb bump` fix; `pnpm pb bump ADR-0005` clears it and sets `version: 2` with `amended`; running `pnpm pb bump ADR-0005` again warns and leaves the file byte-identical.

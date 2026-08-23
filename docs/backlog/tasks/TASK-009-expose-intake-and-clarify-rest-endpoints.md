---
id: TASK-009
title: Expose intake and clarify REST endpoints
type: task
story: US-005
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [ui, clarify]
depends_on: [TASK-008]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: fa271d2c316e }
---
## Scope

Thin REST adapters over existing ops: `POST /api/intake` creates an idea and returns the clarify payload; `POST /api/items/:id/clarify` detects or applies.

## Steps

- [x] `POST /api/intake` `{ title }` → `createItem` idea + `clarifyItem`
- [x] `POST /api/items/:id/clarify` `{ answers? }` → detect or apply
- [x] Cover the round-trip in `test/serve.test.ts` against `test/fixtures/healthy`

## Verification

Intake returns `{ item, clarify }`. Clarify with answers writes back through the same ops as the CLI.

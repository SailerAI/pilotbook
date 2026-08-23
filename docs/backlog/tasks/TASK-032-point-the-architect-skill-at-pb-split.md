---
id: TASK-032
title: Point the architect skill at pb split
type: task
story: US-010
status: done
priority: P2
estimate: 2
phase: 2
owner: unassigned
area: docs
tags: [split, skills]
depends_on: [TASK-031]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: b7d6252bdf16 }
---
## Scope

Documentation only. Update `skills/architect.md` so splitting oversized work runs `pb split <ID> --dry-run`, reviews the plan, then applies. The recommended count stays ops-owned; the agent may fill child titles and bodies but not the count.

## Steps

- [x] Insert the `pb split <ID> --dry-run` → review → apply step into the numbered flow in `skills/architect.md`
- [x] State plainly that the count comes from ops and the agent edits titles and bodies only
- [x] Add `pb split` to the skill frontmatter `commands` list

## Verification

`skills/architect.md` names `pb split --dry-run` before apply and lists `pb split` in `commands`; `pnpm pb lint` exits 0 (docs-only change).

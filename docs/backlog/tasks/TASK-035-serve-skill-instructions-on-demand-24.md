---
id: TASK-035
title: CLI pb instructions and pb skill
type: task
story: US-014
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [instructions, cli]
depends_on: [TASK-034]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 44ae6565fc73 }
---
## Scope

CLI adapters over the same ops. `pb instructions` and `pb instructions overview` both list skills (table; `--json` is the array). `pb skill <name>` prints the markdown body (no YAML); `--json` includes `name`, `commands`, `writes`, `done`. Completions and README command rows.

## Steps

- [x] Add `instructions` and `skill` subcommands in `src/cli/index.ts`
- [x] Completions in `src/ops/complete.ts` for the new commands and skill names
- [x] README command rows

## Verification

`pb instructions` lists shipped skills. `pb skill implement` prints the body. `--json` includes `name`, `commands`, `writes`, `done`.

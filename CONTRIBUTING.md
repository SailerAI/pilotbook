# Contributing to Pilotbook

Thanks for helping. Pilotbook is a small CLI with a hard architectural rule: **no behaviour lives in a transport**. If you are adding a command, add an operation in `src/ops/` first, then a thin CLI/MCP/UI adapter.

This repository is itself a Pilotbook project. Use the local CLI (`pnpm pb`), not a published `npx pilotbook`.

```bash
pnpm build
pnpm pb instructions overview
pnpm pb next
pnpm pb brief TASK-NNN
pnpm pb lint
```

`pnpm lint` is Biome (source style). `pnpm pb lint` is graph integrity over `docs/backlog`, `docs/adr`, and `docs/business-rules`. Both must stay green.

User-facing docs live in `guide/` (GitHub-readable) and publish via VitePress (`pnpm docs:dev`, `pnpm docs:build`). Do not put product docs in `docs/` — that tree is the work-item graph.

Shipped skills live in `skills/*.md`. After editing them, copy into this repo's agent trees:

```bash
pnpm sync:skills
```

A drift test fails if `.cursor/skills/<name>/SKILL.md` or `.claude/skills/pilotbook-<name>.md` diverge from `skills/<name>.md`. `commit` under `.cursor/skills/` is not a shipped skill.

## Setup

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm pb lint
```

Node 20+. pnpm is required (`packageManager` is pinned).

## Layout

- `src/core/` — pure domain over an injected filesystem
- `src/ops/` — every user-facing action, returns structured data
- `src/cli/`, `src/mcp/`, `ui/` — adapters that render ops output
- `test/fixtures/` — whole miniature repos, one scenario per folder

## Tests

Add a fixture and an assertion, not a mock of the filesystem, whenever you change lint, brief, or write paths. `pnpm test` must stay green on ubuntu, macos, and windows.

Parse-then-serialize of an unchanged item must be byte-identical (LF). CRLF files are accepted on read and written back as LF.

## Commits and PRs

Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`). Add a changeset (`pnpm changeset`) for anything that ships in the npm package.

## Release

Maintainers merge to `main`. The release workflow uses npm trusted publishing (OIDC) with provenance. Do not publish from a laptop.

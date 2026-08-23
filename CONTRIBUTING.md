# Contributing to Pilotbook

Thanks for helping. Pilotbook is a small CLI with a hard architectural rule: **no behaviour lives in a transport**. If you are adding a command, add an operation in `src/ops/` first, then a thin CLI/MCP/UI adapter.

## Setup

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm lint
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

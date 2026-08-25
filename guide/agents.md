# Agents, skills, and MCP

Pilotbook is built for agents that already live in the repo. Skills are short markdown protocols. Transports (CLI, MCP, hooks) never own behaviour.

## Init wiring

`pb init` (unless `--ai=false`) installs:

| Host | Path |
| --- | --- |
| Cursor rule | `.cursor/rules/pilotbook.mdc` (always-apply) |
| Cursor skills | `.cursor/skills/<name>/SKILL.md` |
| Claude Code skills | `.claude/skills/pilotbook-<name>.md` |
| Generic agents | `AGENTS.md` (create or append) |

It also appends `.pb` to `.gitignore`. If `.cursor` or `.claude` already exist, those trees are filled; if not, init still writes them when `--ai` is on.

The Cursor rule splits **Explore** (vague demand → discover → shape) from **Ship** (`pb next` → brief → verify).

## Shipped skills

Load one at a time:

```bash
pb instructions overview
pb skill implement
```

| Skill | When | Commands |
| --- | --- | --- |
| **discover** | Vague demand, new idea | `new`, `clarify`, `promote`, `reject`, `lint` |
| **shape** | Fresh epic → user stories | `brief`, `explain`, `new`, `lint`, `board` |
| **architect** | Story → tasks | `brief`, `split`, `new`, `lint` |
| **implement** | Unblocked work | `next`, `brief`, `verify`, `lint`, `board` |
| **groom** | Graph not agent-ready | `lint`, `explain` |
| **prioritize** | Phase / priority proposals | `next`, `lint` |

Canonical copies ship in the npm package under `skills/`. Do not invent IDs. Discover/shape should **search the graph** (`pb search`) before creating a duplicate item.

`commit` under `.cursor/skills/` in this repo is **not** a shipped Pilotbook skill.

## MCP

```bash
pb mcp
```

JSON-RPC over **stdio**. Tools only — no MCP resources or prompts. Cursor example (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "pilotbook": {
      "command": "npx",
      "args": ["pilotbook", "mcp"]
    }
  }
}
```

In this repo, point `command` at the local binary after `pnpm build` (`node dist/cli/index.js` with args `mcp`).

MCP-only tools (no CLI equivalent): `list_items`, `get_item`, `update_item`, `delete_item`, `schema`.

CLI-only: `init`, `board`, `graph`, `ui`, `export`, `seed`, `manifest`, `hook`, `completions`.

Shared tools: `lint`, `brief`, `next`, `status`, `search`, `explain`, `verify`, `promote`, `bump`, `impact`, `analyze`, `converge`, `split`, `reject`, `clarify`, `instructions`, `skill`, `sync`, plus `create_item`.

Full schemas: [API](./api.md).

## Hooks

```bash
pb hook install
```

Writes:

- `.claude/settings.json` — `SessionStart` → `pb hook session-start`, `Stop` → `pb hook stop`
- `.cursor/hooks.json` — the same two commands

`session-start` prints item/lint counts and either the in-progress brief (under `hooks.prime_budget`, default 6000 tokens) or the next-ready list. It does not dump a repo tour.

`stop` is a no-op unless `hooks.block_on_unverified: true`. Then it fails (exit 2) if any `in-progress` item lacks a `verified` object.

## Completions

```bash
pb completions zsh >> ~/.zshrc
```

Also `bash` and `fish`. Completes IDs with titles.

## This repository

Contributors follow [AGENTS.md](../AGENTS.md) and use `pnpm pb`, not `npx pilotbook`.

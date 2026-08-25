# Pilotbook

> Your repo has the chart. Pilotbook has the directions.

[![npm](https://img.shields.io/npm/v/pilotbook.svg)](https://www.npmjs.com/package/pilotbook)
[![CI](https://github.com/SailerAI/pilotbook/actions/workflows/ci.yml/badge.svg)](https://github.com/SailerAI/pilotbook/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/pilotbook.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/pilotbook.svg)](./LICENSE)

Compile what an agent must know before it writes code — from a lint-gated graph of work, decisions, and rules that lives in git. Shipped skills calibrate from `pb profile`, search this graph and this code, then hand off. Cursor and Claude Code are the primary interface.

![pb brief TASK-001](docs/demo.svg)

```bash
npx pilotbook brief TASK-001
```

An agent that reads one task file will improvise the architecture. An agent that reads **the brief** gets the parent story, the epic, every linked business rule and accepted ADR, the `depends_on` chain, and a warning when a decision has been superseded — compiled, ordered by authority, under a token budget.

Plain markdown is the only source of truth. No event log, no SQLite, no server for the core loop. `pb lint` and `pb brief` are pure functions of files on disk.

**[Documentation](https://sailerai.github.io/pilotbook/)** · [Getting started](guide/getting-started.md) · [CLI](guide/cli.md) · [Comparison](guide/comparison.md)

## 60 seconds

Requires Node 20+.

```bash
npx pilotbook init
npx pilotbook new epic --title "Multi-tenant workspaces"
npx pilotbook new story --epic EPIC-001 --title "Create a workspace"
npx pilotbook new task --story US-001 --title "Workspaces schema" --area db
npx pilotbook brief TASK-001
npx pilotbook ui
```

Same binary as `pb` after a global or project install:

```bash
npm i -g pilotbook          # then: pb init
pnpm add -D pilotbook       # then: pnpm exec pb init
```

This repository is itself a Pilotbook project. Contributors use the local build, not npm:

```bash
pnpm build && pnpm pb next
```

## Two loops

**Explore** turns a sentence into an epic and stories. **Ship** turns an unblocked task into verified code.

### Explore

Say "I want a dashboard" in Cursor or Claude Code. Load `pb instructions overview`, then **discover**, then **shape**. Do not jump to `pb next`.

```bash
pb profile --json
pb similar "ops dashboard" --type idea,epic,story
pb ground "ops dashboard"
pb new idea --title "Ops dashboard"
pb clarify IDEA-001
pb promote IDEA-001 --to epic --title "Ops dashboard"
pb new story --epic EPIC-001 --title "View live service health"
pb lint && pb board
```

The agent calibrates from `pb profile`, searches the graph and the code, cites prior art, then writes shippable stories. Worked session: [guide/explore.md](guide/explore.md).

### Ship

```bash
pb next
pb brief TASK-001
pb verify TASK-001
pb lint && pb board
```

1. `pb next` — unblocked work, phase then priority.
2. `pb brief TASK-NNN` — parent story, epic, linked rules and ADRs. Those files are binding.
3. Implement against the brief.
4. `pb verify TASK-NNN` then set `status: done`.
5. `pb lint` must exit 0. `pb board` refreshes `BOARD.md`.

Step-by-step: [guide/ship.md](guide/ship.md). Tab-complete real IDs:

```bash
pb completions zsh >> ~/.zshrc
pb brief TA<TAB>    # TASK-001  Transaction API
```

## Why this

| | Backlog.md | AIPIM | Spec Kit | **Pilotbook** |
| --- | --- | --- | --- | --- |
| Markdown tasks in git | yes | derived from an event log | specs | **yes — only source of truth** |
| Business rules as typed entities | no | no | no | **yes, with edges from stories** |
| Compiled brief for an ID | no | stats + one task | constitution dump | **`pb brief`, authority-ordered** |
| Maturity-calibrated skills | instruction dump | `get_project_context` stats | phase slash-commands | **`pb profile` + protocols with interview, research, handoff** |
| Referential-integrity lint | weak | cycles only | no | **dangling / wrong-type / cycles / unknown fields, with file:line:col** |
| Verification of “done” | no | event-log gate | no | **content-hash in frontmatter, visible in the PR** |

Full write-up: [guide/comparison.md](guide/comparison.md).

## Commands

Every command accepts `--json` except `ui`, `mcp`, and `completions`. Operations live in `src/ops/`; the CLI, MCP server, and UI are thin adapters over the same functions.

<details>
<summary>Explore</summary>

| Command | What it does |
| --- | --- |
| `pb profile` | Derived maturity + calibration hints |
| `pb similar <q>` | Rank items by title-then-body token overlap |
| `pb ground <q>` | Map a demand onto `code_map` and live items |
| `pb new idea --title "…"` | Capture a demand |
| `pb clarify <ID>` | Bounded questions; `--answers` writes back |
| `pb promote <ID> --to epic\|story` | Turn an idea into a work item |
| `pb reject <ID> --reason "…"` | Record a kill verdict |
| `pb search <q>` | Substring search; `--type idea,epic` to filter |
| `pb generate discover` | Optional LLM fallback (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`) |

</details>

<details>
<summary>Navigate</summary>

| Command | What it does |
| --- | --- |
| `pb explain <ID>` | Parent, children, blocked-by, blocks |
| `pb brief <ID>` | Context pack (`--budget`, `--format json`) |
| `pb next` | Unblocked work, phase then priority |
| `pb status [ID]` | Ready/blocked with requires, missingDeps, unlocks |
| `pb instructions [overview]` | Explore/ship router + skill list |
| `pb skill <name>` | Print one skill body |

</details>

<details>
<summary>Ship</summary>

| Command | What it does |
| --- | --- |
| `pb new <type> --title "…"` | Allocate the next ID |
| `pb verify <ID>` | Run `checks.commands`, stamp `verified` |
| `pb lint` | Graph integrity (`--format github`) |
| `pb board` | Regenerate `BOARD.md` |
| `pb converge <ID>` | Append tasks for uncovered criteria |
| `pb analyze` | Coverage and proved `ID#N` criteria |

</details>

<details>
<summary>Graph</summary>

| Command | What it does |
| --- | --- |
| `pb init` | Config, directories, templates, agent skills (`--refresh-skills` upgrades unedited copies) |
| `pb ui` | Kanban + graph + brief preview (`127.0.0.1`) |
| `pb mcp` | MCP server on stdio |
| `pb graph --dot` | Graphviz |
| `pb sync --catalog` / `pb sync --bind '{...}'` | Bind existing Notion databases; `--to notion --from notion` two-way sync (`--dry-run` default) |
| `pb hook install` | Claude Code + Cursor session hooks |

</details>

Full reference: [guide/cli.md](guide/cli.md).

## Docs

- [Getting started](guide/getting-started.md)
- [Explore](guide/explore.md)
- [Ship](guide/ship.md)
- [Concepts](guide/concepts.md)
- [Agents, skills, and MCP](guide/agents.md)
- [Comparison](guide/comparison.md)
- [Config](guide/config.md)
- [Set up Notion](guide/notion.md)
- [Sync with Notion](guide/notion-sync.md)
- [Lint](guide/lint.md)
- [Verify, analyze, converge](guide/verify.md)

## Contributing

This repo dogfoods Pilotbook. See [CONTRIBUTING.md](CONTRIBUTING.md).

[Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

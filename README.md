# Pilotbook

> Your repo has the chart. Pilotbook has the directions.

![pb brief TASK-001](docs/demo.svg)

```bash
npx pilotbook brief TASK-001
```

```
# Brief: TASK-001

### BR-001 — Money is a string
_rule · business-rule · active_

JSON money MUST be a string. MUST NOT be a float.

### ADR-0001 — Numeric money
_adr · adr · accepted_

Store money as decimal strings.

### TASK-001 — Transaction API
_target · task · todo_
…
```

An agent that reads one task file will improvise the architecture. An agent that reads **the brief** gets the parent story, the epic, every linked business rule and accepted ADR, the `depends_on` chain, and a warning when a decision has been superseded — compiled, ordered by authority, under a token budget.

Plain markdown is the only source of truth. No event log, no SQLite, no server for the core loop. `pb lint` and `pb brief` are pure functions of files on disk.

```bash
npm i -g pilotbook
# or
npx pilotbook init
```

Daily driver is `pb` (same binary as `pilotbook`).

```bash
pb next
pb brief TASK-001
pb lint
pb ui          # loopback board
```

Tab-complete real IDs:

```bash
pb completions zsh >> ~/.zshrc
pb brief TA<TAB>    # TASK-001  Transaction API
```

## Why this, not Backlog.md / AIPIM / Spec Kit

| | Backlog.md | AIPIM | Spec Kit | **Pilotbook** |
| --- | --- | --- | --- | --- |
| Markdown tasks in git | yes | derived from an event log | specs | **yes — only source of truth** |
| Business rules as typed entities | no | no | no | **yes, with edges from stories** |
| Compiled brief for an ID | no | stats + one task | constitution dump | **`pb brief`, authority-ordered** |
| Referential-integrity lint | weak | cycles only | no | **dangling / wrong-type / cycles / unknown fields, with file:line:col** |
| Verification of “done” | no | event-log gate | no | **content-hash in frontmatter, visible in the PR** |

## Commands

| Command | What it does |
| --- | --- |
| `pb init` | Config, directories, templates, agent skills |
| `pb new <type> --title "…"` | Allocate the next ID |
| `pb next` | Unblocked work, phase then priority |
| `pb brief <ID>` | Context pack (`--budget`, `--format json`) |
| `pb lint` | Graph integrity (`--format github`) |
| `pb explain <ID>` | Why blocked / what it blocks |
| `pb graph --dot` | Graphviz |
| `pb verify <ID>` | Run `checks.commands`, stamp `verified` |
| `pb board` | Regenerate `BOARD.md` |
| `pb ui` | Kanban + graph + brief preview (127.0.0.1) |
| `pb mcp` | MCP server on stdio |
| `pb seed --from brief.md` | Materialize epics/stories/tasks |
| `pb export --to jira\|notion --dry-run` | One-way export |
| `pb manifest` | Write `.pb/graph.json` for `repo#ID` refs |
| `pb hook install` | Claude Code + Cursor session hooks |

Every command accepts `--json`. Operations live in `src/ops/`; the CLI, MCP server, and UI are thin adapters over the same functions.

## Config

```yaml
# pilotbook.config.yml
root: docs
types:
  epic:  { dir: backlog/epics,   prefix: EPIC-, pad: 3 }
  story: { dir: backlog/stories, prefix: US-,   pad: 3, parent: epic }
  task:  { dir: backlog/tasks,   prefix: TASK-, pad: 3, parent: story }
  adr:   { dir: adr,             prefix: ADR-,  pad: 4 }
  business-rule: { dir: business-rules, prefix: BR-, pad: 3 }
edges:
  depends_on:     { to: [epic, story, task], blocking: true, acyclic: true }
  business_rules: { to: [business-rule] }
  adrs:           { to: [adr] }
code_map:
  backend: [src]
checks:
  commands: [pnpm test, pnpm lint]
hooks:
  block_on_unverified: false
```

Discovery walks up from `cwd` for `pilotbook.config.yml`, then the git root.

## Skills

`pb init` installs skills into `.cursor/rules/`, `.claude/skills/`, and `AGENTS.md` when those conventions exist: **implement**, **groom**, **prioritize**, **architect**, **discover**.

## License

MIT

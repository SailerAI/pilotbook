# CLI

`pilotbook` and `pb` are the same binary. Global flags (on the root command and most subcommands):

| Flag | Meaning |
| --- | --- |
| `--json` | JSON on stdout (errors too) |
| `--cwd <path>` | Working directory |

`ui`, `mcp`, and `completions` do not take `--json`. Failed commands exit 1; `not-found` exits 2. `hook stop` exits 2 when it blocks.

Discovery: walk up from `cwd` for `pilotbook.config.yml` / `.yaml`, else the git root.

## init

```bash
pb init
pb init --ai=false
pb init --refresh-skills
```

Scaffold config, type directories, templates, `.gitignore` (`.pb`), and agent wiring. Skips files that already exist. `--ai` defaults to true. `--refresh-skills` overwrites shipped skills whose content still matches a previously shipped body; locally edited skills are skipped.

## new

```bash
pb new <type> --title "…"
pb new story --epic EPIC-001 --title "…"
pb new task --story US-001 --title "…" --area db
pb new epic --title "…" --goal "…"
```

`type`: `epic` | `story` | `task` | `adr` | `business-rule` | `idea`. Allocates the next ID.

## next

Unblocked work, ladder then phase/priority/estimate. See [Ship](./ship.md).

## status

```bash
pb status
pb status TASK-001
```

No id → ready list (`state` + title). With id → `requires`, `missing`, `unlocks`.

## search

```bash
pb search <q>
pb search <q> --type idea,epic,story
```

Substring over ids, titles, and bodies. `--type` is a comma-separated allow-list; unknown types refuse with a `fix`.

## similar

```bash
pb similar <q>
pb similar <q> --type story
```

Title-then-body token overlap over the markdown index. Empty query → `[]`. No embeddings.

## profile

```bash
pb profile
pb profile --json
```

Derived maturity (`greenfield | shaping | operating | mature`) plus calibration hints. Never writes frontmatter. Git is optional; missing git → `git: null`.

## ground

```bash
pb ground <q>
```

Map a demand onto `code_map` keys and live graph items. Empty `code_map` is not an error (`unmapped: true`).

## generate

```bash
export ANTHROPIC_API_KEY=…
pb generate discover --title "…" --demand "…"
```

Optional CLI fallback: run the **discover** skill with an exported provider token (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`). Optional `PILOTBOOK_LLM_MODEL` overrides the default model. Only `discover` is supported. Missing keys fail with a `fix` that points at `pb skill discover`. Graph commands (`brief`, `lint`, `next`, `profile`, `similar`, `search`, `verify`, `analyze`) never call an LLM. Coding agents remain the primary interface.

## brief

```bash
pb brief <ID>
pb brief <ID> --budget 4000
pb brief <ID> --format json
```

See [The brief](./brief.md).

## instructions / skill

```bash
pb instructions
pb instructions overview
pb skill implement
pb skill implement --json
```

`pb instructions overview --json` is `{ router: { explore, ship }, skills }` — the only explore/ship router. `pb instructions` without `overview` lists skills. `--json` on `skill` includes `commands`, `writes`, `done`. Unknown instruction topics fail.

## lint

```bash
pb lint
pb lint --format github
```

See [Lint](./lint.md). `--format` is `text` (default) or `github`.

## board

```bash
pb board
pb board --dry-run
```

Regenerate `BOARD.md`. Dry-run: `in_sync`, `added`, `orphans`.

## explain

```bash
pb explain <ID>
```

Parent, children, blocked-by, blocks, notes.

## graph

```bash
pb graph --dot
```

Graphviz DOT on stdout. `--dot` defaults true.

## verify

```bash
pb verify <ID>
pb verify <ID> --force
```

See [Verify](./verify.md).

## ui

```bash
pb ui
pb ui --port 4174
pb ui --open=false
```

Loopback board on `127.0.0.1`. `--open` defaults true. See [UI](./ui.md).

## mcp

```bash
pb mcp
```

JSON-RPC MCP server on stdio. See [API](./api.md).

## export

```bash
pb export --to jira
pb export --to notion
pb export --to jira --dry-run=false
```

`--dry-run` defaults **true**. Notion uses the same upsert as `pb sync --to notion`. Jira live export needs env vars — [Interop](./interop.md).

## sync

```bash
pb sync --catalog
pb sync --bind '{"epic":"<id-or-url>"}'
pb sync --init
pb sync --to notion
pb sync --from notion
pb sync --to notion --from notion --dry-run=false
```

`--dry-run` defaults **true**. You must pass `--dry-run=false` to write. Bind existing databases; `--init` only refreshes stored ids. How-to: [Set up Notion](./notion.md) · [Sync with Notion](./notion-sync.md). Reference: [Interop](./interop.md).

## promote / reject / clarify

```bash
pb promote IDEA-001 --to epic --title "Ops dashboard"
pb promote IDEA-001 --to story --title "…" --epic EPIC-001
pb promote IDEA-001 --to epic --title "…" --dry-run
pb reject IDEA-001 --reason "Already shipped as US-009"
pb clarify IDEA-001
pb clarify IDEA-001 --answers '[{ "question": "q1", "option": "a", "text": "…" }]'
```

`--to` must be `epic` or `story`. `--answers` is a JSON array of `{ question, option, text }`.

## bump / impact

```bash
pb bump BR-001
pb impact ADR-0001
```

## analyze / converge / split

```bash
pb analyze
pb converge US-001
pb converge US-001 --dry-run
pb split US-001 --dry-run
pb split US-001
pb split TASK-001 --epic EPIC-001
```

`split` recommends a child count from a complexity score. `--epic` is for splitting a parentless task into a new story under that epic. Review `--dry-run` before applying.

## seed / manifest

```bash
pb seed --from brief.md
pb seed --from brief.md --dry-run
pb manifest
```

`manifest` writes `.pb/graph.json` for cross-repo `repo#ID` refs.

## hook

```bash
pb hook install
pb hook session-start
pb hook stop
```

`install` writes Claude `SessionStart`/`Stop` and Cursor `hooks.json`. `session-start` prints lint counts plus the in-progress brief (or next ready). `stop` exits 2 if `hooks.block_on_unverified` is on and in-progress items have no `verified` block.

## completions

```bash
pb completions zsh >> ~/.zshrc
pb completions bash
pb completions fish
```

Tab-completes real IDs (`pb brief TA<TAB>`). `_complete` is the hidden resolver; do not call it yourself.

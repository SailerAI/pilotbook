# Config

File: `pilotbook.config.yml` or `pilotbook.config.yaml` at the project root (search walks up, then the git root).

Keys accept snake_case or camelCase (`code_map` / `codeMap`, `block_on_unverified` / `blockOnUnverified`). Unknown keys in a type overlay fail parse.

## Defaults after `pb init`

```yaml
root: docs
types:
  epic:  { dir: backlog/epics,   prefix: EPIC-, pad: 3 }
  story: { dir: backlog/stories, prefix: US-,   pad: 3, parent: epic }
  task:  { dir: backlog/tasks,   prefix: TASK-, pad: 3, parent: story }
  adr:   { dir: adr,             prefix: ADR-,  pad: 4 }
  business-rule: { dir: business-rules, prefix: BR-, pad: 3 }
  idea:  { dir: ideas,           prefix: IDEA-, pad: 3 }
edges:
  depends_on:     { to: [epic, story, task], blocking: true, acyclic: true }
  business_rules: { to: [business-rule] }
  adrs:           { to: [adr] }
code_map: {}
checks:
  commands: []
  # report: .pb/junit.xml
hooks:
  block_on_unverified: false
  prime_budget: 6000
```

## Top-level keys

| Key | Default | Meaning |
| --- | --- | --- |
| `name` | `""` | Used in `pb manifest` (else the folder name) |
| `root` | `docs` | Directory that holds type folders |
| `board` | `backlog/BOARD.md` | Relative to `root` |
| `cacheDir` | `.pb` | Manifest, Notion page map, optional JUnit |
| `types` | builtins | Overlays: `dir`, `prefix`, `pad`, `parent`, `required`, `optional`, `enums`, `arrays`, `numbers`, `dates`, `objects`, `template`, `group` |
| `edges` | builtins | `to`, `blocking`, `acyclic`, `scalar` |
| `code_map` | `{}` | Area or tag → source paths included in the brief |
| `checks.commands` | `[]` | `pb verify` argv list |
| `checks.report` | unset | Repo-relative JUnit XML |
| `hooks.block_on_unverified` | `false` | `pb hook stop` gate |
| `hooks.prime_budget` | `6000` | Token ceiling for session-start brief |
| `peers` | `[]` | `{ name, manifest }` for `repo#ID` |
| `interop.notion` | unset | See [Set up Notion](./notion.md) and [Interop](./interop.md) |

## Type overlays

You can change prefixes, directories, or required fields. Keep `idPattern` consistent with `prefix` + `pad` or lint will `bad-id`. Optional keys are allowed by `unknown-field`. Object keys (like `verified` on tasks) are declared in `objects`.

## code_map

```yaml
code_map:
  backend: [src]
  frontend: [ui]
```

If a task `area` or tag matches a key, those paths are added to the brief as a `code-map` section.

## Cache (`.pb/`)

Gitignored. Typical files:

| File | Writer |
| --- | --- |
| `graph.json` | `pb manifest` |
| `notion-map.json` | `pb sync` (page ids + push hashes) |
| `junit.xml` | Your test runner, if `checks.report` points here |

Do not store secrets here. Notion tokens stay in the environment (`NOTION_TOKEN` by default).

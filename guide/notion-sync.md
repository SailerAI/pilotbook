# Sync with Notion

After [Set up Notion](./notion.md), `pb sync` copies properties between markdown and the bound databases. Markdown stays the source of truth. `--dry-run` defaults **true** — nothing is written until you pass `--dry-run=false`.

## Preview

```bash
export NOTION_TOKEN="ntn_…"
pb sync --to notion --from notion
```

Omitting `--to` / `--from` syncs both directions. The report lists per-item actions: `create`, `update`, `skip`, `conflict`, `intake`, with side `to` (markdown → Notion) or `from` (Notion → markdown).

```bash
pb sync --json
```

## Push (markdown → Notion)

```bash
pb sync --to notion --dry-run=false
```

Upserts a Notion page per Pilotbook item in a bound type, keyed by **Pilotbook ID**. Re-running does not duplicate rows. Body is **push-only**: page children are replaced from the markdown file. Edges stay in git.

`pb export --to notion` is the same upsert.

## Pull (Notion → markdown)

```bash
pb sync --from notion --dry-run=false
```

Writes bidirectional scalars through `updateItem`: `title`, `status`, `owner`, `priority`, `tags`, `estimate`, `phase`. Invalid enum values (a Status option the graph does not allow) are skipped. Body and relations are not pulled.

If both sides changed since the last push hash, **Pilotbook wins** and the report lists `conflict`.

## Intake (Notion-first rows)

A row whose **Pilotbook ID** is empty and whose **Name** is not blank is intake: `pb sync --from notion --dry-run=false` allocates a real id with `createItem` (never invent IDs) and PATCHes that id back onto the page. Blank titles are skipped.

Stories and tasks that require a parent still need a **Parent ID** text property with a valid Pilotbook id, or intake is skipped.

## What not to expect

- No webhook or daemon. Run `pb sync` (or a hook you own) when you want a round-trip.
- `push_on_write` in config is opt-in and defaults false.
- Binding does not PATCH someone else's schema. Missing **Pilotbook ID** is a warning.
- Do not run `--dry-run=false` in CI unless you intend to mutate Notion. See [CI](./ci.md).

## MCP

Same ops as the CLI. Tool `sync`:

| Param | Meaning |
| --- | --- |
| `catalog` | List databases the token can see |
| `bind` | Map of type → database id or URL |
| `init` | Refresh stored ids |
| `to` / `from` | Push / pull |
| `dryRun` | Default true |

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `NOTION_TOKEN must be set` | `export NOTION_TOKEN=…` in the same shell as `pb` |
| Catalog empty / `object_not_found` | Share each database with the connection (**••• → Connections**) |
| `No Notion databases are bound` | Run the [wizard](./notion.md) or `pb sync --bind` |
| Duplicate rows in Notion | The database has no **Pilotbook ID** text property, or the name does not match exactly |
| Status does not pull | Select option names must match the graph (`todo`, `in-progress`, …) |
| Title does not round-trip | Rename the database title property to **Name** |

Page ids and push hashes live in `.pb/notion-map.json` (gitignored). They can be rebuilt by querying **Pilotbook ID**.

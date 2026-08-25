# Interop

Markdown is the only source of truth ([ADR-0001](../docs/adr/ADR-0001-markdown-is-the-only-source-of-truth.md)). Notion and Jira are transports ([ADR-0008](../docs/adr/ADR-0008-notion-is-a-transport-not-a-second-graph.md)). They must not grow a second graph.

`--dry-run` defaults **true** on `pb sync` and `pb export`. Pass `--dry-run=false` to write.

How-to: [Set up Notion](./notion.md) · [Sync with Notion](./notion-sync.md).

## Notion

Two-way sync. Identity is the **Pilotbook ID** property — not Notion's auto unique id, and not a UUID in frontmatter. Page ids live in `.pb/notion-map.json` and can be rebuilt by querying that property.

Bind existing databases (they may live under different pages). Pilotbook does not create databases and does not require a shared parent.

### Config

```yaml
interop:
  notion:
    token_env: NOTION_TOKEN
    version: "2025-09-03"
    push_on_write: false
    databases:
      epic: { id: "…", data_source_id: "…" }
      story: { id: "…", data_source_id: "…" }
```

| Key | Meaning |
| --- | --- |
| `token_env` | Env var name for the integration token (default `NOTION_TOKEN`) |
| `parent_page_id` | Ignored. Kept so old configs still parse |
| `version` | Notion API version (default `2025-09-03`) |
| `push_on_write` | Opt-in; default false. No webhook daemon |
| `databases` | Map of type → `{ id, data_source_id }` after bind |

The token is never written to yaml.

### Commands

```bash
pb sync --catalog                      # JSON list of searchable databases
pb sync --bind '{"epic":"<id-or-url>"}'
pb sync --init                         # refresh stored ids (does not create DBs)
pb sync --to notion                    # push markdown → Notion
pb sync --from notion                  # pull Notion → markdown
pb sync --to notion --from notion --dry-run=false
```

`--to` upserts by Pilotbook ID. Body is **push-only**. Edges stay in markdown.

`--from` pulls bidirectional scalars: `title`, `status`, `owner`, `priority`, `tags`, `estimate`, `phase`. A Notion row with an empty Pilotbook ID is **intake**: `createItem` allocates an id (BR-001) and PATCHes it back.

If both sides changed since the last push hash, **Pilotbook wins** and the report lists `conflict`.

`pb export --to notion` is the same upsert as `--to notion`.

Preview first (`--dry-run` default), then apply with `--dry-run=false`.

## Jira

```bash
pb export --to jira
pb export --to jira --dry-run=false
```

Dry-run maps work items (epic/story/task) to issue payloads (`summary`, `labels`, `externalId`). Live POST to `/rest/api/3/issue` requires:

- `JIRA_BASE_URL`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`
- `JIRA_PROJECT`

Issue type is `Bug` only if `type === "bug"`; Pilotbook has no builtin bug type, so exports are `Task`. This is a one-way dump, not a sync. Prefer Notion if you need a human board that round-trips scalars.

## Peers and manifests

Cross-repo refs look like `other#TASK-001` in `depends_on`. Remote refs never block local ready-state.

```bash
pb manifest
```

Writes `.pb/graph.json`:

```json
{
  "name": "pilotbook",
  "generated": "2026-08-25",
  "items": [{ "id": "TASK-001", "type": "task", "title": "…", "status": "todo", "edges": {} }]
}
```

Point at another repo's manifest:

```yaml
peers:
  - name: other
    manifest: /path/to/other/.pb/graph.json
```

Lint resolves `other#TASK-001` against that file. Missing peer ids are `dangling-ref`.

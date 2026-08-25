# Set up Notion

Keep using Notion as the human board. Markdown in git stays the source of truth ([ADR-0008](../docs/adr/ADR-0008-notion-is-a-transport-not-a-second-graph.md)). Pilotbook **binds** databases you already have — it does not create them, and they do not need a shared parent page.

You need a Notion workspace you can share pages with, and Node 20+ with `pb` on your PATH (`npx pilotbook` is the same binary).

## 1. Create an internal connection

Only a **workspace owner** can do this.

1. Open [My integrations](https://www.notion.so/my-integrations), or in Notion go to **Settings → Connections → Develop or manage integrations**.
2. Create a new **internal** connection (newer UIs say **Create a new connection**).
3. Name it `Pilotbook` (or similar) and pick this workspace.
4. On **Configuration**, allow **Read content**, **Update content**, and **Insert content**.
5. Copy the **Internal Integration Secret** / **Installation access token**. Tokens often start with `ntn_`.

Do not put the token in `pilotbook.config.yml`, the board form, or git. Export it in your shell:

```bash
export NOTION_TOKEN="ntn_…"
```

To use another env var name, set `interop.notion.token_env` in config (see [Interop](./interop.md)).

## 2. Prepare one database per type

You need a Notion database for each Pilotbook type you want to sync. They can live in different pages or teamspaces. Bind only the types you use; partial bind is allowed.

Suggested databases: Epics, Stories, Tasks, Ideas, ADRs, Business rules.

On each database, add a **Text** property named exactly:

```text
Pilotbook ID
```

That property is identity. Notion's auto unique id is not used. Pilotbook will **not** add properties for you.

Rename the title property to **Name** (Pilotbook reads and writes `Name`). Optional but useful:

| Property | Notion type | Used for |
| --- | --- | --- |
| Name | Title | Item title |
| Pilotbook ID | Text | Identity (required for upsert) |
| Status | Select | Frontmatter `status` — option names must match the graph |
| Tags | Multi-select | `tags` |
| Priority | Select | `P0` … `P3` on work items |
| Owner | Text | `owner` |
| Estimate | Number | `estimate` |
| Phase | Number | `phase` |

Work-item **Status** options that match the default graph: `backlog`, `todo`, `in-progress`, `review`, `blocked`, `done`, `cancelled`. ADRs, business rules, and ideas use different status enums — see [Items](./items.md). A Notion status that is not in the enum is skipped on pull.

## 3. Share each database with the connection

A new connection can see **nothing** until you grant access. For every database you will bind:

1. Open the database.
2. **•••** (top right) → **Connections** → **Add connection**.
3. Pick the Pilotbook connection and confirm.

You can also grant access from the connection's **Content access** tab in the developer portal. Repeat for each database — sharing a parent page is not enough unless that page actually contains the database.

## 4. Bind types to those databases

Pick one path. CLI, MCP, and the board call the same ops.

### From the board (wizard)

```bash
export NOTION_TOKEN="ntn_…"
pb ui
```

1. Click **Notion** in the header.
2. Confirm the token env is set. There is no token field — if it is missing, export it and reload.
3. For each type, pick a catalog title or paste a database URL (`https://www.notion.so/…-<id>`).
4. Confirm. Types with no **Pilotbook ID** property show a warning; save still binds them.
5. **Save**.

### From the CLI

```bash
pb sync --catalog
```

JSON list of databases the token can see (`id`, `title`, `dataSourceId`, `url`). Then bind — ids or URLs:

```bash
pb sync --bind '{"epic":"https://www.notion.so/Acme/Epics-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","story":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}'
```

Bindings are written to `pilotbook.config.yml`:

```yaml
interop:
  notion:
    token_env: NOTION_TOKEN
    version: "2025-09-03"
    databases:
      epic: { id: "…", data_source_id: "…" }
      story: { id: "…", data_source_id: "…" }
```

`parent_page_id` is ignored if an old config still has it.

Refresh stored ids after someone moved or recreated a database:

```bash
pb sync --init --dry-run=false
```

That retrieves each mapped database. It does **not** create databases. If nothing is bound, the command tells you to open the wizard.

## Next

Run a dry-run sync, then apply: [Sync with Notion](./notion-sync.md). Reference: [Interop](./interop.md).

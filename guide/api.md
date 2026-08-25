# Library, MCP, and REST

Every user-facing action is an operation in `src/ops/`. The CLI, MCP server, and UI call the same functions ([ADR-0002](../docs/adr/ADR-0002-no-behaviour-in-a-transport.md)).

## Programmatic API

The published package exports ops:

```ts
import { withProject, briefOf, lint, nextReady } from "pilotbook";

const ctx = withProject(); // or withProject("/path/to/repo")
const { text } = briefOf(ctx, "TASK-001");
const result = lint(ctx);
const ready = nextReady(ctx);
```

`withProject(cwd?)` loads config + the markdown index. Types ship next to the JS (`dist/ops/index.d.ts`). Prefer the CLI in agents; use the library when you are embedding Pilotbook in another tool.

Useful names: `createItem`, `updateItem`, `verifyItem`, `analyzeGraph`, `profileOf`, `similarItems`, `groundDemand`, `generateSkill`, `parseTypeFilter`, `instructionsOverview`, `syncNotion`, `notionCatalog`, `bindNotion`, `listSkills`, `skillOf`. Errors are `PilotbookError` with `code`, optional `fix`, and `status` (404 → CLI exit 2). `generateSkill` is the only op that may call an LLM; inject `fetch` in tests.

## MCP tools

`pb mcp` — JSON-RPC stdio, protocol `2024-11-05`, tools only.

| Tool | Inputs |
| --- | --- |
| `lint` | — |
| `brief` | `id`, `budget?` |
| `next` | — |
| `status` | `id?` |
| `search` | `q`, `type?` (comma-separated) |
| `similar` | `q`, `type?` |
| `profile` | — |
| `ground` | `q` |
| `generate` | `skill`, `title`, `demand` |
| `list_items` | — |
| `get_item` | `id` |
| `create_item` | `type`, `title`, `epic?`, `story?` |
| `update_item` | `id`, `data?`, `body?` |
| `delete_item` | `id` |
| `explain` | `id` |
| `verify` | `id`, `force?` |
| `schema` | — |
| `promote` | `id`, `to`, `title`, `epic?`, `dryRun?` |
| `bump` | `id` |
| `impact` | `id` |
| `analyze` | — |
| `converge` | `id`, `dryRun?` |
| `split` | `id`, `dryRun?`, `epic?` |
| `reject` | `id`, `reason` |
| `clarify` | `id`, `answers?` |
| `instructions` | — (returns `{ router, skills }`) |
| `skill` | `name` |
| `sync` | `catalog?`, `bind?`, `init?`, `to?`, `from?`, `dryRun?` |

Results are text (JSON-stringified objects). See [Agents](./agents.md) for Cursor config.

## REST (local UI)

`pb ui` serves static files from the package `ui/` folder and these routes on `127.0.0.1`. Not a public API.

| Method | Path | Op |
| --- | --- | --- |
| GET | `/api/schema` | `schemaOf` |
| GET | `/api/items` | `listItems` |
| GET | `/api/lint` | `lint` |
| GET | `/api/next` | `nextReady` |
| GET | `/api/status` | `listReady` |
| GET | `/api/status/:id` | `statusOf` |
| GET | `/api/search?q=&type=` | `searchGraph` (`type` is optional, comma-separated) |
| GET | `/api/brief/:id` | `briefOf` (includes `markdown`) |
| GET | `/api/graph.dot` | `graphDot` |
| GET | `/api/notion` | `notionCatalog` |
| PUT | `/api/notion` | `bindNotion` (`{ databases: { epic: idOrUrl, … } }`) |
| GET | `/api/events` | SSE `{ type: "reload" }` on disk change |
| POST | `/api/board` | `writeBoard` |
| POST | `/api/items` | `createItem` |
| POST | `/api/intake` | create idea + `clarifyItem` |
| POST | `/api/items/:id/clarify` | `clarifyItem` / `applyClarifications` |
| GET | `/api/items/:id` | `getItem` |
| PATCH | `/api/items/:id` | `updateItem` |
| DELETE | `/api/items/:id` | `deleteItem` |

Errors: `{ error, code?, fix? }` with HTTP 400 or 404.

## Surface split

| Capability | CLI | MCP | REST |
| --- | --- | --- | --- |
| init, board, graph, ui, export, seed, manifest, hook, completions | yes | no | board + graph.dot only |
| list/get/update/delete item, schema | no* | yes | yes |
| similar, profile, ground, generate | yes | yes | no |
| brief, lint, next, search, verify, … | yes | yes | most reads + create/clarify |

\*CLI has `pb new` / `pb verify` rather than generic get/update. Edit markdown in git or use MCP/UI to patch frontmatter.

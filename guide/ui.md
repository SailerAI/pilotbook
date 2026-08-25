# UI

```bash
pb ui
pb ui --port 4174 --open=false
```

Local board on **loopback only** (`127.0.0.1`, default port **4173**). It reads and writes the same markdown the CLI does. Ctrl+C stops the process.

If the port is taken: `port 4173 is already in use. Try pb ui --port 4174`.

## What you get

Tabs:

- **Backlog** — epics, stories, tasks
- **Roadmap** — work items by `phase`
- **ADRs**
- **Rules**
- **Ideas** — including an intake form that creates an idea and runs clarify

Views (except roadmap): **Board** (kanban), **List**, **Graph**. Filters for type, epic, phase, and priority. Search is the same substring index as `pb search`. Type-filtered search, `pb similar`, and `pb ground` are CLI and MCP.

Click an item for a peek: frontmatter, body (rendered or source), brief preview, blockers. Create from **New**. **Notion** opens a wizard that lists databases the integration can see (or accepts a pasted URL) and writes bindings to `pilotbook.config.yml`. The token stays in the environment — there is no token field. How-to: [Set up Notion](./notion.md). Drag on the kanban to change `status` — that patches YAML; the file does not move.

The graph reloads when markdown on disk changes (watch + SSE `/api/events`). The lint pill in the header is `pb lint`.

## REST

The UI is a static folder plus a small HTTP API. Same ops as CLI/MCP. See [API](./api.md) for routes. Do not expose this server on a public interface; it binds loopback by design.

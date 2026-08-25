---
id: ADR-0008
title: Notion is a transport not a second graph
type: adr
status: accepted
version: 2
date: 2026-08-24
deciders: [maintainers]
tags: [interop, notion, storage]
supersedes: []
superseded_by: []
content_hash: 94e7eb38e1e0
created: 2026-08-24
updated: 2026-08-24
amended: 2026-08-24
---
## Context

Pilotbook's graph is markdown with YAML frontmatter (ADR-0001). Stakeholders already live in Notion and will not clone the repo to see status. A stub `pb export --to notion` POSTs a new page per item and duplicates on re-run. Two-way sync is required so Notion remains a human board without becoming a second backlog. Notion IDs, webhooks, and block-level body round-trips would fight git review, BR-001, and the "no server in the core loop" rule.

## Decision

Notion is a transport, like the CLI, MCP server, and local UI (ADR-0002). Markdown remains the only source of truth.

- One Notion database per Pilotbook type (epic, story, task, idea, adr, business-rule) under a parent page, provisioned by `pb sync --init`.
- Identity is the Pilotbook ID property. Notion's auto unique_id is not used. Page IDs are cached under `.pb/` and are regenerable by querying that property. Item frontmatter MUST NOT gain a Notion UUID field.
- `pb sync` is an operation in `src/ops/`. Push upserts by Pilotbook ID. Pull writes markdown only through `updateItem`. Intake of a row with an empty Pilotbook ID MUST call `createItem` (BR-001) and PATCH the allocated id back.
- Bidirectional scalars: status, title, owner, priority, tags, estimate, phase. Identity, type, edges, and body are markdown-owned (body is push-only). If both sides changed since the last push hash, Pilotbook wins and the report lists a conflict.
- No webhook server and no daemon. `push_on_write` is opt-in and defaults false. Pull runs when the user (or a hook) invokes `pb sync`.
- Target Notion API version `2025-09-03`. Tests mock `fetch`. Jira stays the existing dry-run stub.

## Consequences

- Re-export is idempotent. Notion-first rows enter the graph with real allocated IDs.
- Agents keep using `pb brief` on files; PMs keep using Notion views.
- Body and live drag-to-git stay out of this ADR. Changing identity storage to frontmatter would require a new ADR.

## Alternatives considered

- One mega-database with a Type select — status enums collide across work/idea/ADR/BR and parent relations are weaker.
- Store `external.notion` on every item — lint rejects unknown fields today; a cache file is regenerable and keeps Notion out of the chart.
- Webhooks or an always-on listener — a server in the core loop, contradicting ADR-0001.
- Notion as source of truth with markdown derived — opposite of ADR-0001.

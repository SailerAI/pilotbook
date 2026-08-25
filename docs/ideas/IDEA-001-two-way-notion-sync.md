---
id: IDEA-001
title: Two-way Notion sync
type: idea
status: promoted
impact: high
effort: high
promoted_to: [EPIC-008]
related: [ADR-0001, ADR-0002, BR-001]
tags: [interop, notion]
created: 2026-08-24
updated: 2026-08-24
---
## Why

Teams that already live in Notion should keep that board without giving up Pilotbook's git-native graph. Agents and PRs still read markdown; PMs still filter, comment, and change status in Notion. Today's `pb export --to notion` posts a new page on every run, so it cannot be the integration.

## Jobs to be done

When I update a story in the repo, I want Notion to show the same title, status, and parent without duplicating the row, so stakeholders stop asking which board is real.

When I change status or owner in Notion, I want the markdown file to update through Pilotbook ops, so git remains the reviewable source of truth.

When I create a row in Notion that has no Pilotbook ID, I want `pb sync` to allocate a real ID via `pb new` / `createItem`, so Notion-first work enters the graph without violating BR-001.

## Personas

- **Stakeholder / PM** who already runs the week out of Notion databases.
- **Builder / agent** who implements from `pb brief` and must not treat Notion as a second backlog.

## Sketch

Six Notion databases under one parent page (Epics, Stories, Tasks, Ideas, ADRs, Business rules), provisioned by `pb sync --init`. Identity is the Pilotbook ID property, not Notion's auto unique_id. Page IDs live in `.pb/` cache, regenerable by query. `pb sync` pushes properties and relations, pulls bidirectional scalars through `updateItem`, and intakes empty-ID rows through `createItem`. Body is push-only. Conflicts: if both sides changed, Pilotbook wins and the report lists them. No webhook server.

## Evidence

- Stub export in `src/ops/interop.ts` (POST-always, CLI-only, `2022-06-28`).
- ADR-0001 — markdown is the only source of truth; no server in the core loop.
- ADR-0002 — no behaviour in a transport; CLI/MCP/UI call ops.
- BR-001 — IDs are allocated by `pb new`.
- Notion API 2025-09-03 data sources: https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03
- Backlog.md has no Notion bridge: https://github.com/mrlesk/backlog.md
- Markdown↔Linear two-way prior art (identity written back, re-import updates): https://github.com/stackingturtles/linearstories

## Open questions

- Should `push_on_write` default off so CI and offline `pb new` never hit the network? (plan: yes, opt-in)
- Do we keep `pb export --to notion` as a deprecated alias of push, or replace it with `pb sync`?

## Why not now

Webhooks, an always-on daemon, and two-way page body / acceptance-criteria checkboxes stay deferred: Notion blocks round-trip is lossy, and a listener would contradict ADR-0001. Schema, identity, conflict policy, and the six-database layout are decided, so this can be promoted.

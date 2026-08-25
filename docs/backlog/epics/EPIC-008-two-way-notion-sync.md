---
id: EPIC-008
title: Two-way Notion sync
type: epic
status: done
priority: P1
estimate: 21
phase: 3
owner: unassigned
tags: [interop, notion]
depends_on: []
related: [IDEA-001, ADR-0001, ADR-0002, ADR-0008, BR-001]
goal: A builder can bind existing Notion databases (they may live separately) and two-way sync properties so Notion stays the human board and markdown stays the source of truth.
created: 2026-08-24
updated: 2026-08-24
---
## Outcome

`pb sync` binds each type to an existing Notion database (no shared parent page), upserts by Pilotbook ID without duplicating rows, dry-runs the plan, pulls bidirectional property edits through `updateItem`, and intakes Notion-only rows through `createItem`. Body stays push-only. Conflicts prefer Pilotbook. Jira is unchanged.

## Stories

- US-038 — Provision Notion databases from Pilotbook
- US-039 — Push the graph without duplicating pages
- US-040 — Preview a sync before it writes
- US-041 — Pull Notion property edits into markdown
- US-042 — Turn a Notion-only row into a Pilotbook item
- US-043 — Bind existing Notion databases from the board

## Success metrics

- Re-running push does not create duplicate Notion pages for the same Pilotbook ID
- `--dry-run` writes nothing to Notion or markdown
- A Notion status change round-trips into frontmatter via ops
- A Notion row with no Pilotbook ID becomes a real allocated item
- `pnpm pb lint` exits 0

# Items and frontmatter

Every item is a markdown file. YAML frontmatter is the schema; the body is the human (and agent) spec. Templates live in `templates/` and are copied by `pb init`.

Create items with `pb new`. Never invent IDs.

```bash
pb new epic --title "…" --goal "…"
pb new story --epic EPIC-001 --title "…"
pb new task --story US-001 --title "…" --area backend
pb new adr --title "…"
pb new business-rule --title "…"
pb new idea --title "…"
```

`--area` is for tasks. `--goal` is for epics. `--epic` / `--story` set the parent. Tasks may omit `story` ([ADR-0004](../docs/adr/ADR-0004-tasks-may-exist-without-a-story-parent.md)); a parentless P0 or estimate ≥ 3 warns `parentless-task`.

There is no builtin `bug` type. Filename: `{id}-<slug>.md`.

Dates are `YYYY-MM-DD`. Arrays are inline YAML (`tags: [api]`, `depends_on: []`). Unknown keys fail `unknown-field`.

## Epic

Required: `id`, `title`, `type`, `status`, `priority`, `estimate`, `phase`, `owner`, `tags`, `depends_on`, `related`, `goal`, `created`, `updated`.

Body: `## Outcome`, `## Stories`, `## Success metrics`.

## Story

Required: `id`, `title`, `type`, `epic`, `status`, `priority`, `estimate`, `phase`, `owner`, `tags`, `depends_on`, `business_rules`, `adrs`, `created`, `updated`.

Body: `## Story` (As a / I want / So that), `## Acceptance criteria` (Given / When / Then checkboxes), `## Notes`, `## Out of scope`.

Criterion index `N` in `covers: [US-001#N]` is **1-based** in that checklist. Reordering the list changes `N`.

## Task

Required: `id`, `title`, `type`, `story`, `status`, `priority`, `estimate`, `phase`, `owner`, `area`, `tags`, `depends_on`, `created`, `updated`.

Optional: `story`, `business_rules`, `adrs`, `covers`. Object: `verified`.

`area`: `backend` | `frontend` | `db` | `infra` | `docs`.

Body: `## Scope`, `## Steps`, `## Verification`.

```yaml
covers: [US-001#2]
verified:
  at: 2026-08-25
  checks: ["pnpm test"]
  hash: abcdef123456
```

## ADR

Required: `id`, `title`, `type`, `status`, `version`, `date`, `deciders`, `tags`, `supersedes`, `superseded_by`, `content_hash`, `created`, `updated`. Optional: `amended`.

Body: `## Context`, `## Decision`, `## Consequences`, `## Alternatives considered`.

After editing the body of an **accepted** ADR, run `pb bump ADR-0001` so `content_hash` matches. Lint error `stale-content-hash` otherwise.

## Business rule

Required: `id`, `title`, `type`, `status`, `domain`, `version`, `content_hash`, `related`, `tags`, `created`, `updated`. Optional: `amended`.

Body: `## Rule` (MUST / MUST NOT), `## Examples`, `## Edge cases`.

Active rules also need a matching `content_hash`. `pb bump BR-001`.

## Idea

Required: `id`, `title`, `type`, `status`, `impact`, `effort`, `promoted_to`, `related`, `tags`, `created`, `updated`.

`impact` / `effort`: `low` | `medium` | `high` | `large`.

Body: `## Why`, `## Sketch`, `## Open questions`, `## Why not now`. Promotion writes `promoted_to` via `pb promote`, not by hand.

## Shared work fields

On epic, story, and task:

| Field | Meaning |
| --- | --- |
| `status` | See [concepts](./concepts.md) |
| `priority` | `P0` … `P3` |
| `estimate` | Number (planning size, not hours) |
| `phase` | Number; roadmap and `pb next` sort by this |
| `owner` | String, often `unassigned` |
| `tags` | Array of strings |
| `depends_on` | Blocking, acyclic refs to epic/story/task |

Edit frontmatter to change status. Do not move files.

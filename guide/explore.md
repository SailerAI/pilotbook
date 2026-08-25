# Explore

This is what Cursor or Claude Code should do when you say **"I want a new dashboard feature."** You can run the same commands yourself.

Load the router, then the **discover** skill, until the idea is an epic. Then **shape** slices that epic into stories. Do not jump to `pb next`.

```bash
pb instructions overview
pb skill discover
```

Without an agent, the same protocol is optional via an exported LLM token: `pb generate discover --title "…" --demand "…"`. Coding agents remain the primary interface.

## Calibrate

```bash
pb profile --json
```

Returns a derived `level` (`greenfield` | `shaping` | `operating` | `mature`) plus `calibration` hints. Maturity is never stored in frontmatter. A greenfield repo gets a harder interview; a mature one reuses accepted ADRs.

## What the agent asks

Discover asks only what is missing — typically **2–5 questions**, then stops:

- Who is this for? (on-call engineer, PM, customer admin)
- What job are they hiring the dashboard for?
- What does "done" look like in one sentence?
- Is there an existing view we should not duplicate?

## Search first

Before creating anything, search the graph and the code so you resume a live item instead of duplicating it:

```bash
pb similar "ops dashboard" --type idea,epic,story
pb search dashboard --type idea,epic,story
pb ground "ops dashboard"
```

`pb similar` ranks title-then-body token overlap (no embeddings). `pb search` is a substring match. `pb ground` maps the demand onto `code_map` keys and live items. An empty similar query returns `[]`. An empty `code_map` is not an error (`unmapped: true`); graph ranking still runs.

If `US-009` already is "search the graph from CLI and UI", `related:` it instead of cloning a search widget story.

Then search the web and similar products (Grafana, Datadog, Linear views). Cite URLs under `## Evidence`. Compare under `## Prior art` (product, link, what they do, what we would do differently).

## Capture the idea

```bash
pb new idea --title "Ops dashboard"
```

You should see `docs/ideas/IDEA-001-ops-dashboard.md` with `status: raw`. Fill the template:

- `## Why`
- `## Jobs to be done`
- `## Personas`
- `## Sketch`
- `## Prior art`
- `## Evidence`
- `## Open questions`
- `## Why not now`

Do not promote an empty sketch or an idea with zero evidence (a URL or an `ADR-` / `BR-` / `US-` id). A promoted idea with no evidence is a `missing-evidence` lint warning.

## Clarify

```bash
pb clarify IDEA-001
```

You should see either `IDEA-001 is ready. Nothing to clarify.` or a numbered question set with options (including Prior art and Evidence gaps).

Apply answers as JSON:

```bash
pb clarify IDEA-001 --answers '[{"question":"q1","option":"a","text":"On-call engineer"}]'
```

Gaps land as acceptance criteria, a business-rule, or an open question — not a freeform essay.

## Promote or reject

When impact, effort, and Why are clear (or `status: exploring`):

```bash
pb promote IDEA-001 --to epic --title "Ops dashboard"
```

You should see:

```text
promoted IDEA-001 → EPIC-00N
```

Files:

- `docs/ideas/IDEA-001-ops-dashboard.md` with `status: promoted` and `promoted_to: [EPIC-00N]`
- `docs/backlog/epics/EPIC-00N-ops-dashboard.md` with an Outcome

Never hand-edit `promoted_to`. `--dry-run` prints what would be created.

To kill it:

```bash
pb reject IDEA-001 --reason "Covered by the existing status page"
```

That records a `## Verdict` so `pb next` stays clean.

Promote to a story under an existing epic with `--to story --epic EPIC-NNN`.

## Shape

Load **shape** in the same turn after promote. Shape does **not** call `pb split`. Split is a later complexity scorer for tasks. Shape is product decomposition: independently shippable **user stories**.

```bash
pb profile --json
pb brief EPIC-00N
pb explain EPIC-00N
pb similar "<epic title and outcome>" --type story
pb new story --epic EPIC-00N --title "View live service health"
pb new story --epic EPIC-00N --title "Filter the board by service"
pb lint
pb board
```

Each story is one user-visible outcome with Given / When / Then and out of scope — not "backend API" vs "frontend page".

Files you should see:

- `docs/backlog/stories/US-0NN-view-live-service-health.md`
- `docs/backlog/stories/US-0NN-filter-the-board-by-service.md`
- The epic `## Stories` list naming those IDs

Wire `depends_on` only when one story cannot ship before another.

Then **architect** breaks a story into tasks (`pb ground`, then `pb split`). **Implement** takes over for unblocked work: [Ship](./ship.md).

# Explore: a new dashboard

This is what Cursor or Claude Code should do when you say **"I want a new dashboard feature."** You can run the same commands yourself.

## What the agent asks

Discover asks only what is missing — typically 2–5 questions, not an interview:

- Who is this for? (on-call engineer, PM, customer admin)
- What job are they hiring the dashboard for?
- What does "done" look like in one sentence?
- Is there an existing view we should not duplicate?

## What it searches

```bash
pb similar "ops dashboard"
pb search dashboard --type idea,epic,story
```

If `US-009` already is "search the graph from CLI and UI", the agent `related:`s it instead of cloning a search widget story.

Then it searches the web and similar products (Grafana, Datadog, Linear views) and cites URLs under `## Evidence`.

## Promote

```bash
pb new idea --title "Ops dashboard"
# fill Why, Jobs to be done, Personas, Sketch, Evidence, Open questions, Why not now
pb clarify IDEA-001
pb promote IDEA-001 --to epic --title "Ops dashboard"
```

Files you should see:

- `docs/ideas/IDEA-001-ops-dashboard.md` with `promoted_to: [EPIC-00N]`
- `docs/backlog/epics/EPIC-00N-ops-dashboard.md` with an Outcome

## Shape

Shape does **not** call `pb split`. It proposes independently shippable stories, then creates them:

```bash
pb brief EPIC-00N
pb explain EPIC-00N
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

Then **implement** takes over: `pb next` → `pb brief TASK-NNN`.

# Getting started

Pilotbook is a CLI. The graph is markdown in your repo. You will have a compiled brief in a few minutes.

Requires **Node 20+**.

## Install

Consumers — pick one:

```bash
npx pilotbook init
```

```bash
npm i -g pilotbook
pb init
```

```bash
pnpm add -D pilotbook
pnpm exec pb init
```

`pilotbook` and `pb` are the same binary.

This repository is itself a Pilotbook project. Contributors use the local build, not a published install:

```bash
pnpm install
pnpm build
pnpm pb next
```

See [CONTRIBUTING.md](../CONTRIBUTING.md).

## What `init` writes

From the repo root, `pb init` creates (skipping files that already exist):

```text
pilotbook.config.yml
templates/epic.md
templates/story.md
templates/task.md
templates/adr.md
templates/business-rule.md
templates/idea.md
docs/backlog/epics/
docs/backlog/stories/
docs/backlog/tasks/
docs/adr/
docs/business-rules/
docs/ideas/
.gitignore                    # appends .pb
.cursor/rules/pilotbook.mdc
.cursor/skills/<name>/SKILL.md   # discover, shape, architect, implement, groom, prioritize
.claude/skills/pilotbook-<name>.md
AGENTS.md
```

`--ai` defaults to true. Pass `--ai=false` to skip agent wiring. Always-apply files tell the agent to run `pb instructions overview` and follow that router — they do not inline the skill bodies.

On an existing install, upgrade unedited shipped skills without clobbering local edits:

```bash
pb init --refresh-skills
```

You should see:

```text
initialized /path/to/repo
wrote: pilotbook.config.yml, templates/epic.md, …
```

## First items

Never invent IDs. `pb new` allocates them.

```bash
pb new epic --title "Multi-tenant workspaces"
pb new story --epic EPIC-001 --title "Create a workspace"
pb new task --story US-001 --title "Workspaces schema" --area db
```

You should see files like:

```text
docs/backlog/epics/EPIC-001-multi-tenant-workspaces.md
docs/backlog/stories/US-001-create-a-workspace.md
docs/backlog/tasks/TASK-001-workspaces-schema.md
```

Open the task, then compile the context pack:

```bash
pb brief TASK-001
pb lint
```

`lint` should print `lint ok: N items, 0 warning(s)` on a fresh graph. Warnings are allowed; errors exit 1.

## First explore

If the demand is a sentence, not a task, do not start with `pb next`. Calibrate, search, then capture:

```bash
pb instructions overview
pb profile --json
pb similar "ops dashboard" --type idea,epic,story
pb ground "ops dashboard"
pb new idea --title "Ops dashboard"
pb clarify IDEA-001
```

You should see `docs/ideas/IDEA-001-ops-dashboard.md` with Why, JTBD, Personas, Prior art, and Evidence sections. Fill those, then:

```bash
pb promote IDEA-001 --to epic --title "Ops dashboard"
```

You should see `promoted IDEA-001 → EPIC-00N`. Load **shape** next and write user stories — full session: [Explore](./explore.md).

## Look at the board

```bash
pb ui
```

Opens `http://127.0.0.1:4173` (loopback only). Reloads when markdown on disk changes. Ctrl+C stops it.

## CI

Add to GitHub Actions (or any runner with Node 20+):

```yaml
- run: npx pilotbook lint --format github
```

`--format github` emits `::error file=…,line=…` annotations. See [CI](./ci.md).

## Next

- [Concepts](./concepts.md) — types, status, why files do not move
- [Explore](./explore.md) — calibrate, research, idea → epic → stories
- [Ship](./ship.md) — pick unblocked work and verify it
- [Set up Notion](./notion.md) — bind existing databases as a human board
- [Agents](./agents.md) — Cursor, Claude Code, MCP

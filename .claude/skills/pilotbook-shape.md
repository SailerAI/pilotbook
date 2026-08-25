---
name: shape
description: >-
  Break a Pilotbook epic into independently shippable user stories.
  Use after an idea is promoted to an epic, when the user asks to slice, split
  into stories, write user stories, or after discover finishes. Do not use to
  break stories into engineering tasks — that is architect. Do not use pb split
  on a freshly promoted epic.
commands: [pb profile, pb brief, pb explain, pb similar, pb new, pb lint, pb board]
writes: [docs/backlog/stories/*.md, docs/backlog/epics/*.md]
done: The epic lists shippable stories created with pb new story --epic. Each story has Given/When/Then and out of scope. pb lint exits 0.
---

# shape

Turn a researched epic into independently shippable **user stories**. Never invent IDs. Create stories with `pb new story --epic EPIC-NNN --title "..."`.

## Calibrate

`pb profile --json`. If the graph is mature, prefer `related:` to live `US-` items over cloning.

## Interview

Ask at most **3** questions if Outcome or who-ships-it is missing. Stop when each proposed story has one user-visible outcome.

## Research

1. `pb brief EPIC-NNN`
2. `pb explain EPIC-NNN`
3. `pb similar "<epic title and outcome>" --type story` — resume a live story instead of duplicating.

## Protocol

Propose independently shippable stories:

- one user-visible outcome each
- Given / When / Then acceptance criteria
- explicit out of scope
- **not** tasks, **not** layers (`backend` / `frontend`)

Show the slice, then write files in the same turn.

Create each story with `pb new story --epic EPIC-NNN --title "..."` and fill `templates/story.md`. Wire `depends_on` only when one story cannot ship before another. Update the epic `## Stories` list. `pb lint` then `pb board`.

## Handoff

When a story is ready to become tasks, load **architect**.

## Do not

- Break a story into tasks (`area`, `depends_on` on tasks). That is **architect**.
- Run `pb split`. Split is a later complexity scorer.
- Ask "should I split?"

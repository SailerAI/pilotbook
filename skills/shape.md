---
name: shape
description: >-
  Break a Pilotbook epic into independently shippable user stories.
  Use after an idea is promoted to an epic, when the user asks to slice, split
  into stories, write user stories, or after discover finishes. Do not use to
  break stories into engineering tasks — that is architect. Do not use pb split
  on a freshly promoted epic.
commands: [pb brief, pb explain, pb similar, pb new, pb lint, pb board]
writes: [docs/backlog/stories/*.md, docs/backlog/epics/*.md]
done: The epic lists shippable stories created with pb new story --epic. Each story has Given/When/Then and out of scope. pb lint exits 0.
---

# shape

Turn a researched epic into independently shippable **user stories**. Never invent IDs. Create stories with `pb new story --epic EPIC-NNN --title "..."`.

Do **not** use this skill to break a story into tasks (`area`, `depends_on` on tasks). That is **architect**.

Do **not** run `pb split` here. Split is a later complexity scorer. Shape is product decomposition: you choose the stories; ops only allocate IDs.

## Protocol

1. `pb brief EPIC-NNN` — Outcome, linked rules, existing children.
2. `pb explain EPIC-NNN` — parent / children / blocked-by.
3. `pb similar "<epic title and outcome>" --type story` so new stories do not clone live `US-` items. If one already covers a slice, `related:` it instead of duplicating.
4. Propose independently shippable stories:
   - one user-visible outcome each
   - Given / When / Then acceptance criteria
   - explicit out of scope
   - **not** tasks, **not** layers (`backend` / `frontend`)
5. Show the slice in the conversation, then write files in the same turn. Do not ask "should I split?"
6. Create each story with `pb new story --epic EPIC-NNN --title "..."` and fill `templates/story.md` (As a / I want / So that, acceptance criteria, out of scope).
7. Wire `depends_on` only when one story cannot ship before another.
8. Update the epic `## Stories` list with the new IDs and titles.
9. `pb lint` then `pb board`.

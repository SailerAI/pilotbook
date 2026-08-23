---
id: EPIC-007
title: Upstream discovery that agents can run
type: epic
status: done
priority: P1
estimate: 13
phase: 2
owner: unassigned
tags: [funnel, discovery, agents]
depends_on: []
related: [EPIC-002]
goal: A builder can say they want a feature in Cursor or Claude Code and leave with a researched idea, a promoted epic, and shippable user stories — without inventing IDs or skipping the graph.
created: 2026-08-23
updated: 2026-08-23
---
## Outcome

"I want a new dashboard" starts the **discover** skill. The agent searches the graph, researches jobs-to-be-done, personas, and similar products, fills an idea, promotes it to an epic, then the **shape** skill slices that epic into independently shippable stories. Cursor and Claude Code attach those skills from a vague demand. The README teaches the explore loop as clearly as the ship loop.

## Stories

- US-032 — Trigger discover from a vague demand
- US-033 — Capture JTBD, personas, and evidence on an idea
- US-034 — Find similar items and filter search by type
- US-035 — Shape an epic into shippable stories
- US-036 — Install the shape skill from pb init
- US-037 — Teach explore and ship loops in the docs

## Success metrics

- Saying "I want a dashboard" in Cursor or Claude Code starts discover, not implement
- A filled idea has Why, Jobs to be done, Personas, Sketch, Evidence, Open questions, and Why not now
- `pb similar` and `pb search --type` keep agents from duplicating live work
- After promote, shape creates stories via `pb new story --epic` and `pb lint` stays clean
- `pb init` installs six skills, including shape
- The README has two numbered loops: Explore and Ship

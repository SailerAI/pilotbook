---
id: EPIC-011
title: Build for outcomes
type: epic
status: backlog
priority: P1
estimate: 21
phase: 4
owner: unassigned
tags: [outcomes, metrics, ux, value, retrospective]
depends_on: []
related: [EPIC-006, EPIC-010, IDEA-004]
goal: Every epic names the number it exists to move, the agent implementing it is told that number, and the result is measured and recorded after ship.
created: 2026-08-30
updated: 2026-08-30
---

## Outcome

"Done" and "worked" stop being the same word. An epic declares a typed outcome — metric, baseline,
target, window, guardrail — and `pb brief` hands the agent that outcome as a directive it can trade
off against. `pb value` reports which work claims an outcome, which is output with no thesis, and
which shipped against a target nobody ever read. A story that touches a user surface carries UX
criteria — states, accessibility, error paths — that `pb analyze` treats as criteria like any other,
so an unusable happy path is the same class of failure as a red test.

## Stories

- US-057 — Declare the outcome an epic exists to move
- US-058 — Compile the outcome into the brief
- US-059 — Report work that claims no outcome
- US-060 — Record the measured result after ship
- US-061 — Hold a user-facing story to UX criteria
- US-062 — Review a change against its UX criteria

## Success metrics

- `pb new outcome` allocates an `OUT-` item with `metric`, `baseline`, `target`, `window`,
  `guardrail`, `source`; epics and stories link it with `outcomes:`
- `pb brief <ID>` renders one Outcome block phrased as a directive (optimize X, do not regress Y),
  satisfying BR-003
- `pb value` lists claimed vs unclaimed work and exits non-zero when a `done` epic has an outcome
  with no recorded reading
- `pb lint` warns when a story with a user-surface task carries no UX criteria
- An unproven UX criterion is reported by `pb analyze` in the same shape as any other unproven
  criterion — no second reporting surface
- `pb skill design` exists and reviews a change against the story's UX criteria without redesigning it

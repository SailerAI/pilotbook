---
id: EPIC-012
title: Ship without getting lost
type: epic
status: backlog
priority: P1
estimate: 21
phase: 4
owner: unassigned
tags: [execution, quality, standards, consistency, defects, agents]
depends_on: []
related: [EPIC-004, EPIC-005, EPIC-006, IDEA-005]
goal: An agent arrives knowing this repo's conventions, is never handed an untestable criterion, never relitigates a dead end, and has somewhere to put a defect.
created: 2026-08-30
updated: 2026-08-30
---

## Outcome

The four things that burn a session are closed. Conventions are discovered from the code and
compiled into the brief for the task's area, so a first draft looks like the code around it.
Untestable criteria are flagged before implementation, not discovered at review. The artifacts are
checked against each other, so a story whose criteria no task claims cannot reach an agent. What was
already tried and rejected travels with the item, so a resumed session does not pay for it twice.
A production defect has a type, a three-step protocol, and an edge to the rule it violated.

## Stories

- US-063 — Discover this repo's conventions as standards
- US-064 — Compile area standards into the brief
- US-065 — Flag untestable acceptance criteria before an agent starts
- US-066 — Check that the artifacts agree with each other
- US-067 — Keep an append-only journal of what was already tried
- US-068 — Triage a defect without inventing an epic

## Success metrics

- `pb standards --discover <area>` proposes `STD-` items as `status: draft`, each with a cited
  `file:line` example, and writes nothing it cannot point at
- `pb brief TASK-NNN` includes accepted standards for that task's `area`, ordered below ADRs and
  business rules
- `pb lint --quality` flags unquantified criteria and criteria that break the Given/When/Then shape,
  with `file:line:col`, using no LLM
- `pb analyze --consistency` exits non-zero on a story criterion no task claims, a task bound to a
  criterion index that does not exist, or a task contradicting an ADR it links
- `pb note <ID>` appends only; a second run leaves earlier entries byte-identical, and `pb brief`
  renders them as "already tried"
- `pb new defect` allocates a `BUG-` item; assess and test never modify source; an unrun
  reproduction is reported `not-run`, never `verified`

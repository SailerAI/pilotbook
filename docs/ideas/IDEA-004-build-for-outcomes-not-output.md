---
id: IDEA-004
title: Build for outcomes, not output
type: idea
status: promoted
impact: high
effort: medium
promoted_to: [EPIC-011]
related: [IDEA-003, US-021, US-028, BR-003]
business_rules: [BR-006]
tags: [outcomes, metrics, ux, value, retrospective]
created: 2026-08-29
updated: 2026-08-30
---
## Why

Every item type in Pilotbook describes **output**: an epic, a story, a task, a rule, a decision.
`## Success metrics` exists on the epic template as three lines of prose that nothing parses,
nothing links, nothing compiles into a brief, and nothing ever checks after the epic closes.
`pb analyze` reports coverage — how much of the *graph* is accounted for — and says nothing about
whether shipping any of it moved anything.

This is the same blind spot in every competitor. Spec Kit's `assess.define` asks for success
metrics and a baseline, then never revisits them; the delivery track (`specify → plan → tasks →
implement`) has no metric anywhere in it. BMAD produces a PRD with goals and moves on. OpenSpec
tracks requirement deltas, not results. Taskmaster decomposes. The whole category optimizes the
speed of producing code and is silent on whether the code was worth producing. An agent that reads
a brief today is told what to build and what rules bind it — it is never told **what number this is
supposed to move**, so it cannot make a single trade-off in favour of the outcome.

The second half of the gap is user experience. A `frontend` task in Pilotbook is an area tag. The
brief that compiles for it contains business rules and ADRs and nothing about states, empty cases,
error handling, or accessibility — so an agent ships the happy path, the story passes its
Given/When/Then, and the result is technically done and practically unusable. BMAD is the only
framework with a UX workflow at all, and it is a persona producing a document, not a criterion a
build can fail on.

Outcome and UX are the same problem wearing two hats: **value that is real to a user is never
written down in a form the machine can check.**

## Jobs to be done

When I open an epic, I want to state the one number it exists to move, its baseline, its target,
and by when — so that "done" and "worked" stop being the same word.

When an agent implements a task, I want the outcome in the brief, so that when it faces a
trade-off it has something to optimize toward besides passing the tests.

When an epic closes, I want a measured result recorded against the target — including when the
result is "no movement" — so the next similar idea gets killed faster.

When I ship anything a person will look at, I want the loading, empty, error, and accessibility
cases to be criteria that can fail, not notes somebody might read.

## Personas

- **Builder / founder** who is accountable for a result, not a burndown.
- **Designer or PM** who wants "usable" to be enforceable rather than negotiated at review time.
- **Coding agent** that will happily ship a happy path unless the brief tells it otherwise.

## Sketch

One new item type, one brief change, one new op, one lint rule, one skill:

- **`outcome`** (`OUT-`) — `metric`, `baseline`, `target`, `window`, `guardrail` (the metric that
  must *not* degrade), `source` (where the number is read from — a dashboard URL, a query, a
  manual note). Epics and stories link it with an `outcomes:` edge. Standard North-Star practice:
  a small tree of outcomes, an epic claims a leaf.
- **`pb brief` renders it** — one "Outcome" block above the acceptance criteria: the metric, the
  target, and the guardrail. Under BR-003 this earns its line only if it changes agent behaviour,
  so it is phrased as a directive ("optimize for X; do not regress Y"), not a report.
- **`pb value`** — the inverse of `pb analyze`. Which epics and stories claim an outcome, which
  claim none (output with no thesis), which outcomes have a measured result, and which shipped
  against a target that was never checked. Exits non-zero when a `done` epic has an outcome with no
  recorded result.
- **UX criteria** — a `ux:` block on stories whose area touches a user surface: required states
  (loading / empty / error / success), a11y baseline (keyboard path, contrast, focus order), and
  responsive breakpoints. `pb lint` warns when a story with a `frontend` task has no `ux:` block;
  `pb analyze` counts an unproven UX criterion exactly like any other unproven criterion, so
  EPIC-006's proof machinery covers it for free.
- **`design` skill** — reviews a proposed or shipped change against the story's UX criteria and the
  repo's own components (via `pb ground`), proposes criteria when they are missing, and hands back
  to `implement`. It reviews; it does not redesign.

Retrospective (US-021) becomes the closing half of the loop: it reads the outcome, records actual
vs target with a source, and is the thing `pb reject` cites the next time a similar idea shows up.

## Prior art

- **Spec Kit `assess.define`** — asks for success metrics with a baseline and a "Cost of Inaction"
  section, then hands off to `specify`; no metric survives into plan, tasks, or implement.
  https://github.com/github/spec-kit/blob/main/extensions/assess/commands/speckit.assess.define.md
- **BMAD v6** — Phase 2 planning produces PRD, personas, and journeys; Phase 3 includes a UX design
  step. Documents produced by personas; nothing a build can fail on.
  https://docs.bmad-method.org/reference/workflow-map/
- **BMAD Test Architect (TEA)** — the only framework with an explicit NFR evidence audit and a
  release gate returning `PASS | CONCERNS | FAIL | WAIVED`. Quality attributes are assessed, not
  asserted. https://github.com/bmad-code-org/bmad-method-test-architecture-enterprise
- **Opportunity solution trees (Teresa Torres)** — start from the business outcome, map
  opportunities under it, generate solutions per opportunity. The standard shape for an outcome
  tree. https://www.koji.so/docs/opportunity-solution-tree
- **Kiro** — EARS notation (`WHEN <condition> THE SYSTEM SHALL <behavior>`) makes requirements
  testable at the sentence level; a good model for how UX criteria should be phrased.
  https://kiro.dev/blog/introducing-kiro/
- **HEART / North Star metric trees** — the metric vocabulary teams already have; nothing agentic
  reads it.

What we would do differently: make the outcome a **typed item the brief compiles**, so it reaches
the agent at the moment of implementation rather than living in a planning doc; and make UX quality
**criteria that `pb analyze` can call unproven**, so an inaccessible empty-state failure is the same
class of defect as a failing test.

## Evidence

- 2026-08-29 — Spec Kit's delivery commands (`specify`, `plan`, `tasks`, `implement`, `converge`,
  `analyze`) contain no metric or outcome artifact; metrics exist only in the optional assess
  extension: https://github.com/github/spec-kit
- 2026-08-29 — BMAD TEA is the category's only quality-gate verdict with waivers
  (`PASS/CONCERNS/FAIL/WAIVED`), and it is scoped to tests and NFRs, not to business results:
  https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/
- 2026-08-29 — Kiro's EARS requirement syntax as the testable-sentence model:
  https://kiro.dev/blog/introducing-kiro/
- `templates/epic.md` — `## Success metrics` is free prose; `src/core/brief.ts` never reads it.
- `src/ops/analyze.ts` — coverage of criteria and rules only; no notion of a result.
- `pilotbook.config.yml` `code_map.frontend: [ui]` — an area exists, but no UX criteria attach to it.
- US-021 (Run an evidence-backed epic retrospective) is the natural host for the measured result and
  is still `backlog`.
- US-028 (Measure brief vs no brief) proves the *tool* works; nothing proves the *work* worked.
- BR-003 — a brief line must change agent behaviour: the outcome block must be a directive.

## Open questions

- Does `outcome` link from the epic only, or from stories too? (Leaning: both — a story that cannot
  name the outcome it serves is usually a story that should not exist, but forcing it on every
  story will produce ceremony.)
- Where does the *measurement* come from? Pilotbook must not become a metrics platform. Leaning:
  the outcome names a source and a human or agent records the reading with a date; `pb value`
  reports the reading's age, it never fetches it.
- Is `ux:` a frontmatter block or a body section with checkboxes? Checkboxes reuse the existing
  criteria machinery (ADR-0003, ADR-0006) for free — probably decisive.
- Should a `done` epic with an unmeasured outcome fail `pb lint`, or only `pb value`? Failing lint
  would block merges on a number nobody can read yet.
- Does the `design` skill need its own type of grounding (a component inventory) beyond `pb ground`?

## Why not now

The outcome type and the UX criteria are independent and both shippable now. The measured-result
half depends on US-021 landing, and deliberately stops short of integrations — no dashboards, no
analytics SDK, no hosted metric store. Ready to promote; sequence the measurement stories behind
the declaration stories.

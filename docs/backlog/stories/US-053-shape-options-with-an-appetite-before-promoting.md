---
id: US-053
title: Shape options with an appetite before promoting
type: story
epic: EPIC-010
status: backlog
priority: P1
estimate: 5
phase: 4
owner: unassigned
tags: [discovery, options, appetite, skills]
depends_on: []
business_rules: [BR-003, BR-006]
adrs: [ADR-0010, ADR-0011]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder with a promising idea,
**I want to** see two or three shaped options with a budget and their rabbit holes,
**So that** I choose an approach knowing what it sacrifices instead of ratifying the first sketch.

## Acceptance criteria

- [ ] Given an idea with research filled in, when the agent runs the `assess` skill, then the idea's
      `## Options` section holds 2–3 options, each with a concept-level sketch, an `appetite`
      (`small` days / `medium` weeks / `large` months), trade-offs, and named rabbit holes.
- [ ] Given the option set, when it is written, then it always includes a "smallest thing that could
      work" option, and a "do nothing / buy instead of build" option where one plausibly exists.
- [ ] Given the options, when the skill recommends one, then the rationale ties to the idea's goals
      and success metrics; and recommending that **no** option is worth building is an accepted
      outcome, not a failure.
- [ ] Given a recommended option, when it is recorded, then the assumptions it depends on are listed
      explicitly so US-056 can track them.
- [ ] Given the `assess` skill, when it runs, then it writes no architecture, API, data model, or
      task breakdown — options stay at concept level.

## Notes

Appetite is a budget, not an estimate — the Shape Up distinction Spec Kit's assess stage adopts.
`assess` slots between `discover` and `shape` in the router (ADR-0010): discover researches, assess
shapes options and hands to `decide`, shape slices the promoted epic into stories.

Every line added to the skill must change what the agent does next (BR-003).

## Out of scope

Rendering the verdict (US-054), any UI for comparing options, and estimating in points.

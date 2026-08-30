---
id: US-071
title: Name every capability in a skill protocol
type: story
epic: EPIC-013
status: backlog
priority: P0
estimate: 5
phase: 4
owner: unassigned
tags: [skills, coverage, agents]
depends_on: []
business_rules: [BR-003, BR-005]
adrs: [ADR-0010, ADR-0011]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** coding agent following a Pilotbook skill,
**I want to** be told which command to run, when, and what to do with the result,
**So that** a capability nobody told me about stops being invisible.

## Acceptance criteria

- [ ] Given the shipped ops, when the coverage check runs, then every op is named by at least one
      skill's `commands:` list, and an uncovered op fails the check by name.
- [ ] Given each new capability from EPIC-010, EPIC-011 and EPIC-012, when its story closes, then a
      skill states the condition to run it and the handoff afterwards — not merely that it exists.
- [ ] Given a skill line, when it is reviewed, then it changes what the agent does next (BR-003) or
      it is cut; the coverage check must not become a reason to pad skills.
- [ ] Given `pb instructions overview`, when an agent loads it, then the router names the new
      protocols (`assess`, `design`, `triage`) alongside the existing ones.
- [ ] Given a skill that names an op which does not exist, when the check runs, then it fails —
      the failure mode US-034 shipped in the past must not recur.

## Notes

The check runs in both directions: an op no skill mentions is unreachable, and a skill naming a
missing op is a lie that has already shipped once in this repo. Both are cheap tests over
`skills/*.md` frontmatter and the ops index.

## Out of scope

Writing the individual skills — each capability's story owns its own protocol text.

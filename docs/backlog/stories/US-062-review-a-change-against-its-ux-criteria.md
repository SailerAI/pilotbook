---
id: US-062
title: Review a change against its UX criteria
type: story
epic: EPIC-011
status: backlog
priority: P2
estimate: 3
phase: 4
owner: unassigned
tags: [ux, skills, agents]
depends_on: [US-061]
business_rules: [BR-003]
adrs: [ADR-0010, ADR-0011]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder without a designer on the team,
**I want to** a skill that reviews a change against the story's UX criteria and this repo's own components,
**So that** the review happens before the pull request instead of after the user complains.

## Acceptance criteria

- [ ] Given `pb skill design`, when it is printed, then it is a protocol with a calibration step, a
      research step (`pb brief`, `pb ground` for existing components), a bounded question budget, a
      handoff, and a `Do not` section — the shape every shipped skill uses.
- [ ] Given a story with UX criteria, when `design` runs, then it reports each criterion as met, not
      met, or unverifiable, and cites the file or component it checked.
- [ ] Given a story with no UX criteria, when `design` runs, then it proposes criteria and hands back
      to `shape`; it does not invent a redesign.
- [ ] Given `pb init`, when it runs, then `design` is installed alongside the existing skills for
      both Claude Code and Cursor.
- [ ] Given a line added to the skill, when it is reviewed, then it changes what the agent does next
      (BR-003) or it is cut.

## Notes

The skill reviews; it does not redesign. Its leverage is `pb ground` — checking a change against the
components this repo already has is what stops an agent from introducing a fourth button style.

## Out of scope

Generating mockups or images, a component library, and any hosted design tool integration.

---
id: US-035
title: Shape an epic into shippable stories
type: story
epic: EPIC-007
status: done
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [skills, shape]
depends_on: [US-032, US-034]
business_rules: [BR-001]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As an** agent that just promoted an idea,
**I want to** a shape skill that slices the epic into user stories,
**So that** I do not stop at the epic or jump to engineering tasks.

## Acceptance criteria

- [x] Given `skills/shape.md`, when it is read, then the description matches "user stories", "slice the epic", and "after promote", and states it is not story→tasks (that is architect)
- [x] Given the numbered protocol, when an agent follows it, then it runs `pb brief` and `pb explain` on the epic, `pb similar` against live `US-` items, proposes independently shippable stories (one user-visible outcome, Given/When/Then, explicit out of scope — not layers), creates them with `pb new story --epic EPIC-NNN --title "..."`, fills `templates/story.md`, wires `depends_on` only when order is required, updates the epic Stories list, then `pb lint` and `pb board`
- [x] Given discover has just promoted, when the same session continues, then shape runs without asking "should I split?" — it shows the slice, then writes files
- [x] Given `pb split` (US-010), when shape runs on a freshly promoted epic, then it does **not** call split — shape is product decomposition; split is a later complexity scorer

## Notes

IDs come only from `pb new` (BR-001). After discover promotes, load this skill immediately.

## Out of scope

Implementing `pb split`. Story→task architect flow. Init copying the file (US-036).

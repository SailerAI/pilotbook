---
id: US-046
title: Capture prior art and evidence on an idea
type: story
epic: EPIC-009
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [ideas, clarify]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001]
created: 2026-08-25
updated: 2026-08-25
---

## Story

**As a** builder capturing a demand,
**I want to** Prior art and Evidence sections on the idea template, with clarify gaps and a lint warning when a promoted idea has no evidence,
**So that** web benchmarks and comparison links survive promotion instead of evaporating into Sketch.

## Acceptance criteria

- [x] Given `templates/idea.md`, when `pb new idea` allocates a file, then the body has Why, Jobs to be done, Personas, Sketch, Prior art, Evidence, Open questions, and Why not now
- [x] Given an idea whose Prior art or Evidence is still a placeholder (no `http` URL and no `ADR-`/`BR-`/`US-`/`EPIC-`/`IDEA-`/`TASK-` ID in Evidence), when I run `pb clarify <ID>`, then ops emit questions for those gaps; existing write-back kinds are unchanged
- [x] Given a `status: promoted` idea with no evidence URL or internal ID, when I `pb lint`, then a `missing-evidence` warning fires on that file — not an error

## Notes

US-033 claimed JTBD / Personas / Evidence already shipped; `templates/idea.md` still has only Why / Sketch / Open questions / Why not now. This story lands those sections plus Prior art. Placeholders must match `isBlankOrPlaceholder`.

## Out of scope

Changing promote/reject gates. A new work-item type for competitors. UI for the new sections.

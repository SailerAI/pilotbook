---
id: US-033
title: Capture JTBD personas and evidence on an idea
type: story
epic: EPIC-007
status: done
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [ideas, clarify]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** builder capturing a demand,
**I want to** the idea template and `pb clarify` to require jobs-to-be-done, personas, and evidence,
**So that** promotion is not just a Why and a Sketch.

## Acceptance criteria

- [x] Given `templates/idea.md`, when `pb new idea` allocates a file, then the body has Why, Jobs to be done, Personas, Sketch, Evidence, Open questions, and Why not now
- [x] Given an idea whose new sections are still placeholders, when I run `pb clarify <ID>`, then ops emit questions for those gaps (including Evidence with no URL or internal ID)
- [x] Given an idea with filled Why, JTBD, personas, sketch, at least one `http` URL or `ADR-`/`BR-`/`US-`/`EPIC-`/`IDEA-`/`TASK-` ID, real open questions, and Why not now, when I clarify, then ops report `ready`
- [x] Given existing write-back kinds (`criterion`, `business-rule`, `open-question`), when I apply answers, then they still land the same way — this story only adds detection

## Notes

Placeholders must match `isBlankOrPlaceholder` the same way Why / Sketch already do.

## Out of scope

Changing promote/reject. UI for the new sections. Embeddings.

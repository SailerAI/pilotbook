---
id: US-005
title: Answer clarifications in the browser
type: story
epic: EPIC-002
status: done
priority: P2
estimate: 5
phase: 2
owner: unassigned
tags: [ui, clarify]
depends_on: [US-002]
business_rules: []
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** builder who is not in a terminal,
**I want to** start from a sentence in the UI and answer clarification questions in a form,
**So that** "I want a better dashboard" does not require the CLI.

## Acceptance criteria

- [x] Given the UI, when I submit a one-line demand, then ops create an idea (via `createItem`) and return the `pb clarify` question set as JSON
- [x] Given the question form, when I pick options and save, then answers write back through a clarify endpoint that calls the same ops as the CLI
- [x] Given ADR-0002, when the UI renders questions, then it does not detect ambiguity itself
- [x] Given a completed clarify, when I look at the item, then the kanban and peek show the written-back criteria or open questions

## Notes

Depends on US-002. Thin adapter over the REST server in `src/ops/serve.ts`.

## Out of scope

A hosted multiplayer UI. Auth. Promote/reject buttons can reuse this form later but are not required here.

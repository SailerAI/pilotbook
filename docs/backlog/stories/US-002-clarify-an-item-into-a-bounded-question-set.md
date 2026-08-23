---
id: US-002
title: Clarify an item into a bounded question set
type: story
epic: EPIC-002
status: done
priority: P1
estimate: 5
phase: 2
owner: unassigned
tags: [clarify, ops]
depends_on: []
business_rules: [BR-001, BR-002]
adrs: [ADR-0002, ADR-0003]
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** builder,
**I want to** run `pb clarify <ID>` on a vague idea, story, or epic,
**So that** ambiguity becomes a bounded question set and answers land back in the graph.

## Acceptance criteria

- [x] Given an item with no acceptance criteria, empty goal, or no linked rules, when I run `pb clarify <ID>`, then ops emit a bounded question set with concrete options (not an unbounded chat)
- [x] Given answers, when they are written back, then they land as acceptance-criteria checkboxes, a new `business-rule` allocated by `pb new`, or a `## Clarifications` / open-question section — never as a transport-only note
- [x] Given `pb clarify --json`, when detection finds nothing, then the payload reports `ready` and writes nothing
- [x] Given the CLI, MCP, and UI, when they call clarify, then they share `src/ops/` and do not reimplement detection

## Notes

Borrowed from Spec Kit `/speckit.clarify`. Detection is deterministic in ops; only phrasing belongs to the agent. ADR-0003 governs write-back into checkboxes.

## Out of scope

The browser form (US-005). Inventing questions the graph cannot justify.

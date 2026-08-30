---
id: US-063
title: Discover this repo's conventions as standards
type: story
epic: EPIC-012
status: backlog
priority: P1
estimate: 8
phase: 4
owner: unassigned
tags: [standards, grounding, types]
depends_on: []
business_rules: [BR-001, BR-002, BR-005]
adrs: [ADR-0001, ADR-0002]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder pointing an agent at an unfamiliar area of the repo,
**I want to** the conventions extracted from the code itself and written down,
**So that** its first draft looks like the code around it instead of a house style it invented.

## Acceptance criteria

- [ ] Given `standard` registered in config (prefix `STD-`), when I run
      `pb standards --discover backend`, then proposed `STD-` items are created with
      `area`, a convention statement, and a cited `file:line` example.
- [ ] Given a convention the repo applies inconsistently, when it is proposed, then the proposal
      includes the counter-example and says the repo disagrees with itself — it does not pick a side
      silently.
- [ ] Given any proposal, when it is written, then `status: draft`; a standard reaches `accepted`
      only by a human or agent editing it, and `pb standards --discover` never accepts its own
      proposals.
- [ ] Given a convention it cannot point at with a `file:line`, when discovery runs, then the
      convention is not written at all.
- [ ] Given `--dry-run`, when I run discovery, then the proposals are printed and no file changes.
- [ ] Given a second run over unchanged code, when it completes, then it creates no duplicate
      `STD-` item for a convention already recorded.

- [ ] Given the capability, when the story closes, then it is reachable as an MCP tool, returns structured `--json` output, and is named by the skill that would run it (BR-005).

## Notes

Agent OS's Discover Standards is the direct prior art and the reason this is worth building: the
re-teaching cost is paid on every prompt, forever. The Pilotbook difference is that a standard is a
typed item in the same lint-gated graph, scoped to a `code_map` area, so US-064 can compile only the
relevant ones.

Discovery is where an LLM is genuinely useful; keep the op's output a proposal so the graph
commands stay honest. Under ADR-0011 the coding agent does the reading, with `pb generate` as the
fallback.

## Out of scope

Compiling standards into the brief (US-064), enforcing a standard in CI, and rewriting code to match
a standard.

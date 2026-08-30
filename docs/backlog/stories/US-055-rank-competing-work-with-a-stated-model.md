---
id: US-055
title: Rank competing work with a stated model
type: story
epic: EPIC-010
status: backlog
priority: P2
estimate: 5
phase: 4
owner: unassigned
tags: [prioritization, rank, skills]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0001, ADR-0011]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder asked why this before that,
**I want to** rank the backlog with a model whose arithmetic is printed,
**So that** the answer is a number I can argue with rather than an opinion I have to defend.

## Acceptance criteria

- [ ] Given items carrying `reach`, `impact`, `confidence`, and `effort`, when I run
      `pb rank --model rice`, then a table is printed with each input, the formula, and the score,
      ordered descending.
- [ ] Given `--model wsjf` or `--model ice`, when I run it, then the corresponding formula is used
      and named in the output.
- [ ] Given an item missing a scoring field, when I rank, then the item is listed as unscorable with
      the missing field named — it is never silently defaulted to zero.
- [ ] Given the same files, when I run `pb rank` twice, then the output is byte-identical — no LLM,
      no network, no clock.
- [ ] Given `pb rank`, when the `prioritize` skill runs, then it reads the rank and argues with it
      in writing; a proposed priority that contradicts the rank must carry a stated reason.

## Notes

`pb next` stays phase-then-priority for the ship loop. `pb rank` is a planning view, not a change to
what an agent is handed next — the two must not disagree silently, so `prioritize` is the place the
disagreement gets written down.

## Out of scope

Writing `priority` into frontmatter automatically, a portfolio or roadmap view, and estimating
effort on the builder's behalf.

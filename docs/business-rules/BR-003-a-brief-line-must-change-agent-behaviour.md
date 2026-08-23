---
id: BR-003
title: A brief line must change agent behaviour
type: business-rule
status: draft
domain: brief
version: 1
content_hash: 4d2903c12865
related: []
tags: [brief, pruning]
created: 2026-08-23
updated: 2026-08-23
---
## Rule

Every line the brief compiler emits MUST be able to change what an agent does next. A line that would not change behaviour MUST NOT ship in the brief.

The compiler MUST NOT include: what the code already says, repo structure or file maps, ecosystem defaults, tour or overview prose, style rules a linter or formatter owns, history narration, or aspirational state.

The compiler MUST include: policy the code cannot express, divergences from ecosystem defaults, pitfalls admitted from observed failure, and negative constraints that name the permitted alternative.

A rule or ADR retires when the thing it guards is gone, or a human sets `status: deprecated`. Absence of recent failures is NEVER grounds for dropping a line.

## Examples

### Drop a file map

Given a task with `area: backend` and `code_map.backend: [src]`, when compiling a brief, then emit the path list as a fetch hint at most once, not a tour of every file under `src`.

### Keep a negative constraint

Given BR-001 ("IDs are allocated by pb new"), when compiling a brief for a task that creates items, then include the rule — removing it would let the agent invent IDs.

## Edge cases

- Truncation under `--budget` MUST drop lowest-authority sections first and MUST report what it dropped (`brief_truncated`). Silence is a violation of this rule.
- A linter landing (`pnpm lint` / Biome) deletes the corresponding style line from future briefs; the graph does not store "use 2-space indent".
- This rule is draft until the brief compiler enforces it. Implementers of brief, session priming, and the agent contract MUST treat it as binding once `status: active`.

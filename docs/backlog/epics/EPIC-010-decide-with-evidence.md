---
id: EPIC-010
title: Decide with evidence
type: epic
status: backlog
priority: P1
estimate: 21
phase: 4
owner: unassigned
tags: [discovery, decisions, evidence, benchmarks, prioritization]
depends_on: []
related: [EPIC-007, EPIC-011, IDEA-003]
goal: A demand is judged against cited external evidence and a scored verdict before it becomes work, and the evidence stays checkable after the call is made.
created: 2026-08-30
updated: 2026-08-30
---

## Outcome

An idea cannot become an epic on enthusiasm. Promotion requires a recorded verdict; a verdict on
weak or uncited evidence is mechanically downgraded to `needs-clarification`. The benchmarks an
agent found while researching survive as typed items that a story can cite, a brief can render, and
lint can call stale. Competing work is ranked by a model whose arithmetic is printed. The
assumptions a decision rests on are tracked until they are tested or broken.

## Stories

- US-051 — Capture an external benchmark as a citable item
- US-052 — Warn when a decision rests on stale evidence
- US-053 — Shape options with an appetite before promoting
- US-054 — Record a scored verdict on every promote or kill
- US-055 — Rank competing work with a stated model
- US-056 — Track the assumptions a decision depends on

## Success metrics

- `pb new benchmark` allocates a `BM-` item; a story or idea cites it with `benchmarks:`; `pb lint`
  reports a dangling `BM-` reference with `file:line:col` like any other edge
- `pb brief <ID>` renders cited benchmarks under Evidence, below binding rules and accepted ADRs
- `pb stale` exits non-zero when a `backlog` or `todo` item cites a benchmark older than
  `evidence.max_age_days`, and exits 0 with zero network access
- `pb decide <ID>` writes a six-criterion scorecard and a `go | needs-clarification | kill` verdict;
  `pb promote` refuses an idea whose verdict is missing or not `go`
- `pb rank --model rice` prints the inputs, the formula, and the score for each ranked item, and is
  a pure function of files on disk
- A `broken` assumption linked from a `backlog` or `in-progress` epic is a lint warning

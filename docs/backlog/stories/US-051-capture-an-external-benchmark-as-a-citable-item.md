---
id: US-051
title: Capture an external benchmark as a citable item
type: story
epic: EPIC-010
status: backlog
priority: P1
estimate: 5
phase: 4
owner: unassigned
tags: [benchmarks, evidence, types]
depends_on: []
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0005]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder researching a demand,
**I want to** record an external number as a typed item with its source, date, and confidence,
**So that** the next decision starts from the last one's evidence instead of a fresh web search.

## Acceptance criteria

- [ ] Given `benchmark` is registered in `pilotbook.config.yml` (prefix `BM-`), when I run
      `pb new benchmark --title "Checkout conversion, mid-market SaaS"`, then a file is created with
      `metric`, `value`, `source`, `observed`, `confidence` (`high|medium|low`), and
      `kind` (`competitor|market|industry|internal`).
- [ ] Given a story or idea with `benchmarks: [BM-001]`, when I run `pb lint`, then the edge
      resolves; and given `benchmarks: [BM-999]`, then lint reports a dangling reference with
      `file:line:col` in the same shape as every other edge error.
- [ ] Given a benchmark cited by an item, when I run `pb brief <ID>`, then the benchmark renders
      under Evidence — below binding business rules and accepted ADRs — with its value, date, and
      confidence, and is never presented as binding.
- [ ] Given a benchmark whose `source` carries userinfo or credential query parameters, when it is
      written, then the URL is stored sanitized.
- [ ] Given `pb new benchmark`, when the same title is used twice, then IDs are still allocated by
      `pb new` and never hand-written (BR-001).

## Notes

Follows the ADR/BR precedent: a new type is config in `pilotbook.config.yml` plus a template, not a
new subsystem. `content_hash` and `version` apply as they do to ADRs and rules (ADR-0005) so a
corrected benchmark can report sync-impact on the items that cited it.

The type is deliberately separate from `business-rule`: a rule binds and a benchmark informs, and
mixing them would corrupt the authority ordering `pb brief` depends on.

## Out of scope

Fetching benchmarks (the coding agent does that under ADR-0011), any hosted or cached benchmark
corpus, and staleness reporting — that is US-052.

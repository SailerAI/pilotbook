---
id: BR-004
title: A criterion is proven by a green test or a named reviewer
type: business-rule
status: draft
domain: criteria
version: 1
related: []
tags: [criteria, verify]
created: 2026-08-23
updated: 2026-08-23
---

## Rule

An acceptance criterion is proven by a green bound test or by a named reviewer ticking the box. It is NEVER proven by assertion, by a passing suite that does not name the criterion, or by an agent writing `[x]` on a reviewer-owned line.

A criterion whose test title contains `ID#N` (ADR-0006) is machine-ownable. `pb verify` and `pb analyze` MUST report its last result. An agent MUST NOT tick or untick it.

A criterion with no bound test is reviewer-owned. `pb verify` MUST NOT tick it (US-019). Only a human sets `[x]`.

A story MUST NOT reach `status: done` while a machine-ownable criterion is missing, failing, or skipped in the latest report.

## Examples

### Bound and green

Given story `US-024` criterion 2 and a test titled `US-024#2 reports unproven criteria in the coverage table` that passed in the JUnit report, when analyzing coverage, then that criterion is `proved` and MUST NOT appear as unproven.

### Unbound stays human

Given story `US-019` criterion 1 and no test title containing `US-019#1`, when an agent runs `pb verify`, then the box stays `[ ]` and the diagnostic is `criteria_unverified`.

## Edge cases

- A suite that exits 0 with no report file proves nothing about any criterion.
- A bound test that is skipped counts as unproven, not green.
- Reordering the checklist changes `N`. Existing titles MUST be updated; lint MUST warn, not invent a match by text similarity.
- ADR-0003 and ADR-0006 are accepted. This rule stays `draft` until verify, analyze, and the done-gate implement it; then set `status: active`. Implementers of those stories MUST treat it as binding.

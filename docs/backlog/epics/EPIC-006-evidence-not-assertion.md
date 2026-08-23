---
id: EPIC-006
title: Evidence, not assertion
type: epic
status: backlog
priority: P1
estimate: 21
phase: 3
owner: unassigned
tags: [evidence, criteria, drift, eval]
depends_on: []
related: []
goal: Every claim Pilotbook makes — this criterion holds, this code is accounted for, this brief helps — is backed by something a machine can recompute.
created: 2026-08-23
updated: 2026-08-23
---

## Outcome

A story cannot be `done` while a machine-ownable criterion has no passing bound test. Changed paths that no in-flight item claims surface as drift. A published number says whether compiling a brief actually improves completion.

## Stories

- US-023 — Capture per-test results, not just exit codes
- US-024 — Report unproven criteria
- US-025 — Gate done on proof
- US-026 — Detect code that no in-flight item claims
- US-027 — Surface drift in CI and the pre-commit hook
- US-028 — Measure brief vs no brief on a fixed task set
- US-029 — Publish the number and correct BR-003 if contradicted

## Success metrics

- `pb verify` can name which tests passed, not only that the suite exited 0
- `pb analyze` reports unproven criteria (criterion index, bound test, last result)
- A story with a bound failing or missing test cannot reach `status: done`
- `pb drift` exits non-zero when a changed `code_map` key has no claiming in-progress or review item
- An eval artifact records completion and rework with and without a compiled brief

---
id: US-057
title: Declare the outcome an epic exists to move
type: story
epic: EPIC-011
status: backlog
priority: P1
estimate: 5
phase: 4
owner: unassigned
tags: [outcomes, metrics, types]
depends_on: []
business_rules: [BR-001, BR-002, BR-005]
adrs: [ADR-0001, ADR-0005]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder accountable for a result,
**I want to** state the one number an epic exists to move, with its baseline and target,
**So that** "done" and "worked" stop being the same word.

## Acceptance criteria

- [ ] Given `outcome` registered in config (prefix `OUT-`), when I run `pb new outcome --title
      "Time from clone to first brief"`, then the item carries `metric`, `baseline`, `target`,
      `window`, `guardrail`, and `source`.
- [ ] Given an epic or story with `outcomes: [OUT-001]`, when I run `pb lint`, then the edge
      resolves and a dangling `OUT-` reference is reported with `file:line:col`.
- [ ] Given an outcome, when I run `pb explain OUT-001`, then every epic and story claiming it is
      listed with its status.
- [ ] Given an outcome with a `guardrail`, when it is rendered anywhere, then the guardrail is shown
      as the metric that must not degrade, distinct from the target.
- [ ] Given `templates/epic.md`, when this ships, then `## Success metrics` points at the linked
      outcome rather than duplicating it in prose.

- [ ] Given the capability, when the story closes, then it is reachable as an MCP tool, returns structured `--json` output, and is named by the skill that would run it (BR-005).

## Notes

An outcome tree is a small set of `OUT-` items where an epic claims a leaf — the North Star shape,
kept as flat markdown. Linking from stories is allowed but never required; forcing it on every story
produces ceremony rather than clarity.

## Out of scope

Fetching a metric from anywhere, dashboards, analytics SDKs, and reporting a measured result — that
is US-060.

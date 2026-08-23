---
id: US-027
title: Surface drift in CI and the pre-commit hook
type: story
epic: EPIC-006
status: backlog
priority: P2
estimate: 3
phase: 3
owner: unassigned
tags: [drift, ci, hooks]
depends_on: [US-026]
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** see unclaimed `code_map` keys in CI and before commit,
**So that** drift is caught when code moves, not when someone remembers to run `pb drift`.

## Acceptance criteria

- [ ] Given US-026, when CI runs graph checks, then it also runs `pb drift --format github` (or equivalent annotations) against the PR base
- [ ] Given `pb hook` / installed pre-commit, when staged paths map to an unclaimed key, then the hook fails with a message that names the key and the `pb drift` command
- [ ] Given `hooks.block_on_drift: false` (or equivalent config), when set, then the hook reports and exits 0
- [ ] Given CLI, MCP, and hooks, when they compute drift, then they call the same ops function as US-026

## Notes

Reuse `src/ops/hooks.ts` and the `--format github` path already used for lint in `.github/workflows/ci.yml`. Do not add a second drift implementation in the workflow YAML.

## Out of scope

GitHub Check Run API. Blocking merge from the UI. Auto-opening a task for an unclaimed key.

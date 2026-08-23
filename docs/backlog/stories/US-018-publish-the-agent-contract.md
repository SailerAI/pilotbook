---
id: US-018
title: Publish the agent contract
type: story
epic: EPIC-005
status: backlog
priority: P2
estimate: 3
phase: 2
owner: unassigned
tags: [contract, docs]
depends_on: [US-017]
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As an** agent or CI job,
**I want to** a published contract for every `pb` command,
**So that** JSON, diagnostics, and exit codes are stable enough to script.

## Acceptance criteria

- [ ] Given `docs/agent-contract.md` (or equivalent under `docs/`), when I read it, then it documents: one JSON document per invocation on stdout with prose on stderr, the envelope `{severity, code, message, target?, fix?}`, null-shapes on failure, and an exit-code table (0 success including health findings, 1 failure)
- [ ] Given a diagnostic catalog, when I look up `brief_truncated`, `dangling-ref`, `criteria_unverified`, then each has a `fix` that is one runnable command
- [ ] Given `--json` on a failing command, when it errors, then it still prints its empty/error shape plus `status` diagnostics — not a stack trace as the only output
- [ ] Given ADR-0002, when a new command is added, then the contract is updated in the same change

## Notes

Borrowed from OpenSpec `docs/agent-contract.md`. Mostly writing down and stabilizing `src/cli/render.ts`. Depends on US-017 so `brief_truncated` exists to catalog.

## Out of scope

Changing every command's human output in one PR. A machine-generated OpenAPI spec.

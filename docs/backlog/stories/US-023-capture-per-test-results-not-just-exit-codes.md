---
id: US-023
title: Capture per-test results, not just exit codes
type: story
epic: EPIC-006
status: done
priority: P1
estimate: 5
phase: 3
owner: unassigned
tags: [verify, junit]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0002]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** `pb verify` to parse per-test results from a JUnit report,
**So that** later stories can prove a named criterion, not only that the suite exited 0.

## Acceptance criteria

- [x] Given `checks.commands` and a configured report path, when `pb verify` runs, then each command still records `{command, exit, ms}` and, if the report file exists after the commands, ops parse JUnit XML into `{name, classname, status, time}` (`status` is `pass` | `fail` | `error` | `skipped`)
- [x] Given `--json`, when I read the payload, then it includes `results` (the parsed tests) even when the suite exit is 0
- [x] Given no report file after the commands, when I verify, then existing exit-code behaviour is unchanged and `results` is an empty array — not an error
- [x] Given CLI and MCP `verify`, when they run, then they share ops; neither parses XML in the transport

## Notes

Today `src/ops/verify.ts` pipes stdout and discards it. Do not start capturing stdout. `shell: false` stays. The portable contract is a report file (vitest 3.2: `--reporter=junit --outputFile=...`). This story does not match `ID#N` tokens — that is US-024 (ADR-0006 is accepted).

## Out of scope

Criterion matching. Changing `verified` frontmatter shape. TAP or vitest-JSON parsers. Writing the report into git.

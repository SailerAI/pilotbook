---
id: US-069
title: Reach every capability through MCP, not only the CLI
type: story
epic: EPIC-013
status: done
priority: P0
estimate: 3
phase: 3
owner: unassigned
tags: [mcp, parity, ci]
depends_on: []
business_rules: [BR-005]
adrs: [ADR-0002, ADR-0011]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** coding agent driving Pilotbook over MCP,
**I want to** reach every capability the CLI has,
**So that** I never have to shell out, parse a table, or hand-write a file to work around a missing
tool.

## Acceptance criteria

- [x] Given the ops exported from `src/ops/index.ts`, when the parity test runs, then every
      user-facing op has a corresponding MCP tool, and a missing one fails the test by name.
- [x] Given a new op added without an MCP tool, when CI runs, then it fails with the op name and the
      file to edit — the gap is never discovered by an agent at runtime.
- [x] Given every CLI command except `ui`, `mcp`, and `completions`, when invoked with `--json`, then
      it returns structured output an agent can parse (BR-005).
- [x] Given an MCP tool, when it fails, then the error carries the same `fix` string the CLI would
      print, so an agent gets a next action rather than a stack trace.
- [x] Given `pb mcp` and the CLI, when the same op runs through both, then the returned data is
      identical — the transport renders, it never decides (ADR-0002).

## Notes

This is the story that makes BR-005 real. It costs little today because the MCP server already
exposes 28 tools; the value is that it stays true as EPIC-010, EPIC-011 and EPIC-012 add ops.

## Out of scope

Adding new ops, an HTTP transport, and MCP resources or prompts (US-073 covers command surfaces).

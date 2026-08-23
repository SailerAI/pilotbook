---
id: ADR-0002
title: No behaviour in a transport
type: adr
status: accepted
date: 2026-08-23
deciders: [maintainers]
tags: [architecture]
supersedes: []
superseded_by: []
created: 2026-08-23
updated: 2026-08-23
---
## Context

Pilotbook is exposed as a CLI, an MCP server, and a local UI. Duplicating logic in each adapter would drift.

## Decision

No behaviour lives in a transport. Every user-facing action is an operation in `src/ops/` that returns structured data. `src/cli/`, `src/mcp/`, and `ui/` only render that output.

## Consequences

New commands land in `src/ops/` first, then a thin adapter. Tests can call ops against an injected filesystem without spawning a server.

## Alternatives considered

- Logic in the CLI with MCP/UI reimplementing it — three sources of truth.
- A single HTTP API that CLI and MCP call — a server in the core loop, contradicting ADR-0001.

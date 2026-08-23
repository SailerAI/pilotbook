---
id: ADR-0001
title: Markdown is the only source of truth
type: adr
status: accepted
date: 2026-08-23
deciders: [maintainers]
tags: [storage]
supersedes: []
superseded_by: []
created: 2026-08-23
updated: 2026-08-23
---
## Context

Agents and humans need a shared backlog, decisions, and rules that survive a PR review. Event logs and SQLite hide the graph from git and from `pb brief`.

## Decision

Plain markdown with YAML frontmatter is the only source of truth. `pb lint` and `pb brief` are pure functions of files on disk. No event log, no SQLite, and no server for the core loop.

## Consequences

The graph is reviewable in git. Status changes by editing frontmatter, not by moving files. Optional UI/MCP are adapters over the same ops.

## Alternatives considered

- Event log plus derived markdown (AIPIM) — markdown is no longer authoritative.
- A database beside the repo — the PR cannot show the graph.

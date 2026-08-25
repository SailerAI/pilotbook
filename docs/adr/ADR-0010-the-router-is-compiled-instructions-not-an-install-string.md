---
id: ADR-0010
title: The router is compiled instructions not an install string
type: adr
status: accepted
version: 2
date: 2026-08-25
deciders: [maintainers]
tags: [agents, skills]
supersedes: []
superseded_by: []
content_hash: 75c1c908263a
created: 2026-08-25
updated: 2026-08-25
amended: 2026-08-25
---
## Context

Explore vs ship routing was copied into `CURSOR_RULE`, `AGENTS_SNIPPET`, and this repo's `.cursor/rules/pilotbook.mdc`. The copies drifted (shape omitted from the dogfood rule). Cursor and Claude Code then attached different workflows.

## Decision

`pb instructions overview` is the only explore/ship router. It returns the skill list plus a `router` object (`explore`, `ship`). Init-written always-apply files MUST tell the agent to load that command and MUST NOT inline a third numbered protocol. Transports only render `listSkills` / the overview payload (ADR-0002).

## Consequences

Fix the router once in ops. Cursor, Claude Code, and `AGENTS.md` stay short. Progressive disclosure (US-014) stays intact: the always-apply file is a pointer, not a skill dump.

## Alternatives considered

- Keep three hand-maintained strings and a sync script — still three sources of truth.
- MCP prompts for routing — MCP stays tools-only; prompts would be a fourth copy.

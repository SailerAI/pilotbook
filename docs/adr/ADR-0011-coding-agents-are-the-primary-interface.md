---
id: ADR-0011
title: Coding agents are the primary interface
type: adr
status: accepted
version: 2
date: 2026-08-25
deciders: [maintainers]
tags: [agents, llm]
supersedes: []
superseded_by: []
content_hash: 8c8a229342ce
created: 2026-08-25
updated: 2026-08-25
amended: 2026-08-25
---
## Context

Builders live in Cursor and Claude Code. Those hosts already have an LLM, tools, and the repo. Pilotbook's wedge is a lint-gated graph plus skills those agents follow. A second product — `pb` calling a provider with an exported token — is useful when no agent is open, but if graph commands start calling an LLM, the agent interface gets worse (hidden cost, non-deterministic lint, keys required to `pb next`).

## Decision

Coding agents are the primary interface. Skills, `pb brief`, MCP tools, and session hooks are designed for them first.

`pb generate <skill>` is an optional fallback: it runs a shipped skill body with `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Graph commands (`brief`, `lint`, `next`, `profile`, `similar`, `search`, `verify`, `analyze`) MUST NOT call an LLM even when a key is exported. Missing keys MUST fail with a `fix` that points at `pb skill`, not at signing up for Pilotbook-hosted inference. No Pilotbook proxy (ADR-0001). Writes go through `createItem` / `updateItem` (BR-001, ADR-0002).

## Consequences

Agent sessions stay deterministic on the graph. CLI-only users can still run discover. Tests inject `fetch`. Adding `generate shape` later is a story, not a new architecture.

## Alternatives considered

- Require a token for `pb init` / `pb next` — punishes the primary user.
- A Pilotbook-hosted LLM proxy — a server in the core loop (ADR-0001) and a worse agent UX than Cursor/Claude already provide.
- Embeddings for `pb similar` — US-034 forbids them; token overlap stays local.

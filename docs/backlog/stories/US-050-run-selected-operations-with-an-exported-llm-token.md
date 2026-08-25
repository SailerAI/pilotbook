---
id: US-050
title: Run selected operations with an exported LLM token
type: story
epic: EPIC-009
status: done
priority: P1
estimate: 8
phase: 2
owner: unassigned
tags: [agents, llm]
depends_on: [US-047]
business_rules: [BR-001, BR-002]
adrs: [ADR-0001, ADR-0002, ADR-0011]
created: 2026-08-25
updated: 2026-08-25
---

## Story

**As a** builder without Cursor or Claude Code open,
**I want to** `pb generate <skill>` to run a shipped protocol with my exported LLM token,
**So that** I can still get a researched idea from the CLI — without making Pilotbook's agent interface worse or requiring a token for `brief` / `lint` / `next` / `profile` / `similar`.

## Acceptance criteria

- [x] Given `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, when I run `pb generate discover --title "..." --demand "..."`, then ops load the discover skill body plus `pb profile` JSON, call the provider, and `createItem` an idea (BR-001) whose body has the idea template sections filled from the model — no invented IDs
- [x] Given neither key, when I generate, then ops throw a `PilotbookError` with a `fix` that says to use Cursor/Claude Code skills (`pb skill discover`) or export a provider token — and write nothing
- [x] Given `pb brief`, `pb lint`, `pb next`, `pb profile`, `pb similar`, and `pb search`, when they run, then they never call an LLM even if a key is exported
- [x] Given CLI and MCP, when they generate, then they call the same ops function (ADR-0002). Tests inject `fetch`; no SDK dependency

## Notes

Coding agents remain the primary interface. `pb generate` is an optional CLI fallback that executes the same skill markdown the agent would follow. Do not add a Pilotbook-hosted proxy (ADR-0001). Provider is detected from env; optional `PILOTBOOK_LLM_MODEL` overrides the default. Only `discover` is required in this story; other skills may refuse with a `fix`.

## Out of scope

Streaming chat UI. Fine-tuning. A second graph. Replacing skills in Cursor/Claude. Bundling API keys. Shape/architect/implement generate.

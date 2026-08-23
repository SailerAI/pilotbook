---
id: TASK-036
title: MCP instructions and skill tools
type: task
story: US-014
status: done
priority: P1
estimate: 2
phase: 2
owner: unassigned
area: backend
tags: [instructions, mcp]
depends_on: [TASK-034]
created: 2026-08-23
updated: 2026-08-23
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: 2be067fcad02 }
---
## Scope

MCP tools `instructions` and `skill` in `src/mcp/index.ts` call `listSkills` / `skillOf`. No skill parsing in the transport (ADR-0002).

## Steps

- [x] Register `instructions` and `skill` in TOOLS
- [x] `callTool` delegates to ops

## Verification

MCP `instructions` and `skill` return the same structured data as ops. No filesystem reads in `src/mcp/`.

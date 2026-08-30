---
id: BR-005
title: A capability is not shipped until an agent can reach it
type: business-rule
status: draft
domain: agents
version: 1
content_hash: pending
related: []
tags: [agents, mcp, skills, hosts]
created: 2026-08-30
updated: 2026-08-30
---
## Rule

Pilotbook is built for coding agents (ADR-0011). A capability that only a human typing in a terminal
can reach is not shipped.

Every operation in `src/ops/` MUST be reachable through **both** transports: the CLI and the MCP
server. Adding an op without an MCP tool is an incomplete story, not a follow-up. Transports stay
thin (ADR-0002) — parity is a wiring obligation, never a second implementation.

Every capability MUST be named by at least one shipped skill in `skills/*.md`, stating the condition
under which the agent runs it and what it does with the result. A command no skill tells an agent to
run does not exist from the agent's side. Skill lines remain subject to BR-003.

Every shipped skill MUST install into every supported host at `pb init` — `.cursor/skills/`,
`.claude/skills/`, and the `AGENTS.md` router that Codex and other AGENTS.md-reading hosts follow —
and a drift test MUST fail when a host copy diverges from `skills/<name>.md`.

Output an agent must parse MUST be available as `--json` (or a structured MCP result). Human table
rendering is an adapter concern.

An op MUST NOT require a human to answer an interactive prompt. Anything that needs a decision is a
flag, a refusal with a `fix`, or a question the skill tells the agent to ask.

## Examples

### A new op

Given `pb rank` ships as a CLI command, when the story is reviewed, then it is not done until
`rank` is an MCP tool, `--json` returns the scores, and the `prioritize` skill names when to run it.

### A new item type

Given `benchmark` is registered, when an agent creates one over MCP, then `create_item` accepts the
type and `schema` reports its fields — the agent never hand-writes a file to work around a missing
tool.

### A host that is not Cursor or Claude Code

Given a repo with `AGENTS.md` and no `.cursor` or `.claude` directory, when `pb init` runs, then the
router reaches the agent through `AGENTS.md`, and `pb instructions overview` returns the same
router the other hosts get.

## Edge cases

- `ui`, `mcp`, and `completions` are transports themselves and are exempt from the `--json` clause.
- A capability may ship behind a flag for one host first, but the story MUST name the hosts left
  behind; silent single-host support is a violation.
- This rule is draft until a parity check exists. Implementers of new ops MUST treat it as binding
  once `status: active`.

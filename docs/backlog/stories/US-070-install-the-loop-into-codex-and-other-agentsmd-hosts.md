---
id: US-070
title: Install the loop into Codex and other AGENTS.md hosts
type: story
epic: EPIC-013
status: backlog
priority: P0
estimate: 5
phase: 4
owner: unassigned
tags: [hosts, init, codex, skills]
depends_on: []
business_rules: [BR-005]
adrs: [ADR-0010, ADR-0011]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder working in Codex, or any host that reads `AGENTS.md`,
**I want to** get the same loop Cursor and Claude Code users get from one `pb init`,
**So that** my choice of agent does not decide whether Pilotbook works.

## Acceptance criteria

- [ ] Given a repo with `AGENTS.md` and no `.cursor` or `.claude` directory, when I run `pb init`,
      then the router and the skill list are installed where that host reads them, and no host is
      silently skipped.
- [ ] Given `pb init --host codex` (and the hosts we choose to support), when it runs, then that
      host's prompt or command directory receives the shipped skills, generated from
      `skills/*.md` — never hand-maintained per host.
- [ ] Given any supported host, when I run `pb instructions overview`, then the router returned is
      identical across hosts (ADR-0010) — one compiled router, not three copies.
- [ ] Given a host copy that has diverged from `skills/<name>.md`, when the drift test runs, then it
      fails and names the file.
- [ ] Given a host we do not support, when `pb init` runs, then the output names it as unsupported
      rather than pretending coverage (BR-005).
- [ ] Given `pb init --refresh-skills`, when a host copy is unedited, then it is upgraded; an edited
      copy is left alone and reported.

## Notes

Spec Kit's distribution across 30+ agent integrations is the reason it wins the first session.
Matching the list is not the goal — reaching Codex and every AGENTS.md host is, because that is
where the builders we lose today are working.

`AGENTS.md` is already written by `pb init`; the gap is that the skills themselves do not reach
those hosts, so the router points at protocols the agent cannot load.

## Out of scope

Session hooks for hosts beyond Claude Code and Cursor, and slash commands (US-073).

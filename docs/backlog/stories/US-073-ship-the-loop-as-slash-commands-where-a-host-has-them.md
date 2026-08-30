---
id: US-073
title: Ship the loop as slash commands where a host has them
type: story
epic: EPIC-013
status: done
priority: P2
estimate: 5
phase: 3
owner: unassigned
tags: [hosts, skills, distribution]
depends_on: [US-070]
business_rules: [BR-005]
adrs: [ADR-0010]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder in a host with slash commands,
**I want to** start a Pilotbook protocol by typing its name,
**So that** the loop is discoverable in the interface I already use instead of a doc I have to read.

## Acceptance criteria

- [x] Given the shipped skills, when `pb init` runs in a host that supports commands, then a command
      per skill is generated from `skills/<name>.md` — one source, never a hand-maintained copy per
      host.
- [x] Given a generated command, when it is invoked, then it loads the same protocol body
      `pb skill <name>` returns, so a host command and the CLI never drift.
- [x] Given a change to a shipped skill, when `pnpm sync:skills` runs, then the generated commands
      update and the drift test covers them.
- [x] Given a host without command support, when `pb init` runs, then the router alone is installed
      and the host is reported as router-only, not as failed.
- [x] Given the generated commands, when they are listed, then their descriptions come from each
      skill's `description` field — one place to edit.

## Notes

Spec Kit's `/speckit.*` commands are the reason its process feels like part of the host. The
Pilotbook version is cheap because the skills already carry name, description, and body — generation
is a rendering step, and rendering belongs in an adapter (ADR-0002).

## Out of scope

A plugin marketplace listing, host-specific UI, and hooks (already shipped for Claude Code and
Cursor).

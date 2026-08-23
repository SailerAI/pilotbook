---
id: US-019
title: Refuse to tick reviewer-owned criteria
type: story
epic: EPIC-005
status: backlog
priority: P2
estimate: 3
phase: 2
owner: unassigned
tags: [verify, criteria]
depends_on: []
business_rules: [BR-002]
adrs: [ADR-0003]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** reviewer,
**I want to** `pb verify` to count my unchecked acceptance criteria and stop,
**So that** a checked box means I decided, not that code ran.

## Acceptance criteria

- [ ] Given a story has unchecked reviewer-owned criteria, when an agent runs `pb verify` on a child task (or the story), then it reports `{code: "criteria_unverified", count}` and does not tick those boxes
- [ ] Given `pb verify` on a task, when `checks.commands` pass, then it still stamps `verified` on the task — the human-owned boxes on the parent story stay untouched
- [ ] Given `--force`, when used, then it may bypass the hash/checks gate (existing behaviour) but MUST still not tick reviewer-owned criteria
- [ ] Given CLI and MCP `verify`, when they run, then they share ops

## Notes

Borrowed from Spec Kit's reviewer-ownership rule. ADR-0003 is accepted; this story implements the parsed-checklist gate. Contrast with OpenSpec `/opsx:verify`, which finds gaps and does not block.

## Out of scope

A UI checkbox that the reviewer clicks (follow-up). Auto-filing converge tasks from unverified criteria.

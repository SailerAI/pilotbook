---
id: US-004
title: Record a kill verdict on an idea
type: story
epic: EPIC-002
status: backlog
priority: P2
estimate: 2
phase: 2
owner: unassigned
tags: [assess, ops]
depends_on: []
business_rules: []
adrs: [ADR-0001]
created: 2026-08-23
updated: 2026-08-23
---

## Story

**As a** builder,
**I want to** reject an idea with a recorded reason,
**So that** deciding not to build is a first-class, reviewable outcome.

## Acceptance criteria

- [ ] Given an idea, when I run `pb reject IDEA-NNN --reason "..."`, then `status` is `rejected` and the body gains a `## Verdict` section with the reason and date
- [ ] Given a rejected idea, when I run `pb promote` on it, then ops refuse
- [ ] Given `pb next`, when listing work, then rejected ideas do not appear
- [ ] Given `--json`, when I reject, then the payload includes `verdict: kill`

## Notes

Borrowed from Spec Kit's `assess` extension (go / needs-clarification / kill). `idea` already has `rejected` in `IDEA_STATUS`; nothing reaches it honestly today.

## Out of scope

A full intake → research → shape pipeline. Re-opening a killed idea (can be a later task).

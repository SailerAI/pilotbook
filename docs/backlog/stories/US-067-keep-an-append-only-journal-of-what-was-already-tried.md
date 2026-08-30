---
id: US-067
title: Keep an append-only journal of what was already tried
type: story
epic: EPIC-012
status: backlog
priority: P1
estimate: 5
phase: 4
owner: unassigned
tags: [journal, brief, agents, continuity]
depends_on: []
business_rules: [BR-002, BR-003]
adrs: [ADR-0001]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder resuming an item after three days, or handing it to a second agent,
**I want to** the approaches already tried and rejected to travel with the item,
**So that** nobody spends another forty minutes rediscovering the same dead end.

## Acceptance criteria

- [ ] Given an item, when I run `pb note TASK-NNN --tried "…" --outcome rejected|partial|adopted`,
      then an entry with a date is appended to the item's journal.
- [ ] Given existing entries, when I append another, then earlier entries are byte-identical
      afterwards — the journal is append-only, like `pb converge`.
- [ ] Given an item with journal entries, when I run `pb brief <ID>`, then they render as "already
      tried — do not repeat", phrased as a directive so the line earns its budget under BR-003.
- [ ] Given `--budget N`, when the brief is truncated, then journal entries are dropped before
      binding rules and after the outcome, and the truncation is reported.
- [ ] Given a journal entry, when it is written, then it records the approach and the reason it was
      abandoned — a transcript dump is not an entry.
- [ ] Given `pb hook` session priming (US-022), when a session starts on an in-progress item, then
      the journal is part of what is primed.

## Notes

This is the highest-leverage item in the epic for "get there in less time": it is the only mechanism
that stops a fresh context window from repeating work that has already been paid for. Keeping it in
the item file means it shows up in the pull request diff, where a reviewer can see the path taken.

Watch the size: the journal is the one section that grows without bound, so budget interaction is a
criterion, not an afterthought.

## Out of scope

Storing transcripts, any external memory store, and automatic journaling without an explicit call.

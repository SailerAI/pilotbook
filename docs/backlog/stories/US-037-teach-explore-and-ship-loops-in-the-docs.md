---
id: US-037
title: Teach explore and ship loops in the docs
type: story
epic: EPIC-007
status: done
priority: P1
estimate: 3
phase: 2
owner: unassigned
tags: [docs]
depends_on: [US-032, US-034, US-035]
business_rules: []
adrs: []
created: 2026-08-23
updated: 2026-08-23
---
## Story

**As a** builder opening the repo for the first time,
**I want to** a README and getting-started path that teach Explore then Ship,
**So that** I know the exact command for each step and what I should see next.

## Acceptance criteria

- [x] Given `README.md`, when I read past the brief demo, then two numbered loops exist: **Explore** (demand → idea → epic → stories, dashboard example, copy-paste commands, files that appear) and **Ship** (`pb next` → `pb brief` → implement → `pb verify` → `pb lint`)
- [x] Given the README command table, when I scan it, then commands are grouped Explore / Navigate / Ship / Graph so `clarify`, `promote`, `reject`, `search`, `similar`, and `explain` are as visible as `brief`
- [x] Given `docs/getting-started.md`, when I follow it, then the same two walkthroughs exist as step-by-step operations (heading, exact command, what I should see, next command)
- [x] Given `docs/explore.md`, when I read it, then it is a worked "new dashboard" session: what the agent asks, what it searches, promote, shape, resulting files
- [x] Given `docs/index.md`, when I open the hub, then it links Explore, Ship (getting started), Commands (README), and Comparison

## Notes

Crystal-clear means one operation per heading. No architecture essay in the getting-started path. Skills list in the README must include shape.

## Out of scope

Rewriting the comparison page's competitive table. A video. Changing CLI help strings except as already done by other stories.

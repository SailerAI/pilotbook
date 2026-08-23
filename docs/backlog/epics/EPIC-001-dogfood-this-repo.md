---
id: EPIC-001
title: Dogfood this repo
type: epic
status: done
priority: P1
estimate: 8
phase: 1
owner: unassigned
tags: [dogfood]
depends_on: []
goal: This repository is a Pilotbook-managed project driven by the local CLI.
created: 2026-08-23
updated: 2026-08-23
---
## Outcome

Contributors pick unblocked work with `pnpm pb next`, load a brief, and keep the graph green in CI. This repo uses the same default layout a consumer gets from `pb init`.

## Stories

- US-001 — Run Pilotbook on the Pilotbook repo

## Success metrics

- `pnpm pb lint` is in CI and exits 0
- `pnpm pb brief` on an in-progress task includes accepted ADRs and active BRs

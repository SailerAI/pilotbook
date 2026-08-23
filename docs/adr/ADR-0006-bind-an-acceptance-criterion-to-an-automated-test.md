---
id: ADR-0006
title: Bind an acceptance criterion to an automated test
type: adr
status: accepted
version: 1
date: 2026-08-23
deciders: [maintainers]
tags: [criteria, verify]
supersedes: []
superseded_by: []
content_hash: 59bf79ae15ac
created: 2026-08-23
updated: 2026-08-23
---
## Context

`pb verify` records `{command, exit, ms}` per check and discards piped stdout. It can prove the suite passed. It cannot prove criterion 3 holds. Acceptance criteria live on stories as markdown checklists; `verified` is a task-only object (`objects: ["verified"]` on the task type). Binding each criterion to a test is the field's open problem, and it needs two decisions: how the link is expressed, and where proof is stored.

ADR-0003 is a prerequisite: without a parsed `{index, text, checked}` list there is no stable key to bind to. US-019 treats unchecked boxes as reviewer-owned; a bound green test is the complement — those boxes become machine-ownable.

A frontmatter map (`criteria: [{index, test}]`) would be easy for JSON consumers and a second source of truth next to the test file, which fights ADR-0001. A test-name convention keeps the binding where tests are maintained and works across runners and languages.

## Decision

Bind by test-name convention, not a frontmatter map. A test proves criterion `N` of item `ID` when its title (JUnit `classname` + `name`, or equivalent) contains the token `ID#N` with `N` 1-based in ADR-0003 parse order. Example: a vitest title `US-024#2 reports unproven criteria in the coverage table`.

Proof is computed from the latest JUnit report and is not stored as item frontmatter. `verified` stays task-only and keeps meaning "this task's content hash was checked". Stories do not gain a `verified` object. Ops (`verify`, `analyze`, lint) read a configured report file, match `ID#N` tokens against parsed criteria, and return structured `proved` / `unproven` lists. The report path is project config, not per-item schema.

Do not "fix" rename or reorder fragility with a frontmatter map. A broken `ID#N` is a lint warning (`unbound-rename`).

This decision unblocks US-024 and US-025. Criterion-to-test matching MUST NOT invent a second bind schema.

## Consequences

- Any language whose runner can emit JUnit XML participates without a Pilotbook plugin (ADR-0002: ops parse a file; transports do not).
- Renaming a story ID or reordering its checklist breaks the bind until titles are updated — that is a lint warning (`unbound-rename`), not a silent pass.
- A criterion with a matching test is machine-ownable (BR-004). A criterion without one stays reviewer-owned (US-019).
- The `done` gate (US-025) is exact only when a report is present. CI after `checks.commands` always has one. Local `pb lint` without a report is a warning, not an error — same spirit as skipping `unverified-done` when `checks.commands` is empty.
- `verify` JSON grows a `results` array of `{name, status, time}` plus `proved: [{id, index, test, status}]`. Nothing new is written into story files.

## Alternatives considered

- Frontmatter `acceptance_criteria[].test` map — easier for consumers, worse git diffs, a second chart beside the test file, fights ADR-0001.
- Give `story` `objects: ["verified"]` and stamp per-criterion proof there — mixes the task content-hash stamp with a suite-wide report, goes stale the moment tests re-run without `pb verify`, and invites agents to write "proved" by editing YAML.
- Parse TAP or vitest JSON from captured stdout — `verify` spawns with `shell: false` and currently discards stdout; a report file is the portable contract and does not require shelling out.
- Convention on file path (`test/US-024.test.ts`) instead of title token — cannot address criterion index, and many stories share a test file.

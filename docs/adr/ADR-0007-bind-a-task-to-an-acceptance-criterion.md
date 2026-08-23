---
id: ADR-0007
title: Bind a task to an acceptance criterion
type: adr
status: accepted
version: 1
date: 2026-08-23
deciders: [maintainers]
tags: [criteria, schema]
supersedes: []
superseded_by: []
content_hash: 44e46943e5cf
created: 2026-08-23
updated: 2026-08-23
---
## Context

`pb analyze` (US-015) has to answer "which acceptance criteria has nobody planned work for", and `pb converge` (US-016) has to append exactly the tasks that close those gaps. Both are graph queries, so both need a link from a task to a single criterion. Today a task points at a story (`story:`), and ADR-0004 lets it point at nothing at all. Story-level parentage is too coarse: a story with four criteria and four tasks says nothing about which criterion each task closes.

ADR-0003 is the prerequisite — it parses `## Acceptance criteria` into `{index, text, checked}` with `index` 1-based in parse order, which is the only stable key on offer. ADR-0006 already spends a token grammar on that key: a test title contains `ID#N` to prove criterion `N` of item `ID`. A task-side link with its own shape would leave the repo with two ways to name one criterion.

## Decision

A task declares the criteria it closes in frontmatter: `covers: [US-015#2]`. The token is ADR-0006's grammar unchanged — `ID#N`, with `N` 1-based in ADR-0003 parse order — so the plan (task frontmatter) and the proof (test title) name a criterion identically. `covers` is optional and repeatable; a task may cover criteria on more than one story, or none at all.

`covers` is a plain array field on the `task` type, **not** an entry in `builtinEdges()`. `US-015#2` is not an item ID, so `refsOf` would report every token as a `dangling-ref`. Ops that need the story split the token themselves.

Lint gains one check, `unbound-criterion` (warning), mirroring ADR-0006's `unbound-rename`: the story resolves but carries no criterion at index `N`, or the token is not `ID#N` at all. A token whose story ID does not exist anywhere in the graph is a `dangling-ref` error, like any other missing reference.

This decision unblocks US-015 and US-016. Criterion coverage MUST NOT invent a second criteria schema: no `criteria:` frontmatter array, no bind block inside the body, no fuzzy match on criterion text.

## Consequences

- `pb analyze` keys its coverage table on `ID#N`, crossing `covers` tokens with the parsed checklist, without reading a test report.
- `pb converge` appends tasks carrying `covers: [US-0NN#K]`, which is what makes idempotence provable — a gap it closed cannot reappear on the next run.
- One grammar spans plan and proof: a criterion is planned when a task covers it, and machine-ownable when a test names it (ADR-0006).
- Reordering a checklist breaks `covers` exactly as it breaks a test title. That is `unbound-criterion`, not a silent rematch by text.
- `covers` never blocks work. It is absent from `builtinEdges()`, so `pb next` ordering, cycle detection, and `depends_on` are untouched.
- Existing tasks carry no `covers` and stay lint-clean. An uncovered criterion is an `analyze` finding, not a lint failure.

## Alternatives considered

- Frontmatter `criteria: [{index, task}]` on the story — a second chart beside the checklist, and it files a task's own plan in someone else's item.
- Reuse `depends_on` or `related` with an `ID#N` value — those are edges; `refsOf` and cycle detection would have to learn a token grammar they have no use for.
- Match criterion text against task titles — the fuzzy rematch ADR-0003 forbids outright.
- One task per criterion by convention with no field at all — unenforceable, and it breaks the moment one task legitimately closes two criteria.

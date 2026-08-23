---
id: ADR-0003
title: Structured acceptance criteria vs freeform body
type: adr
status: accepted
date: 2026-08-23
deciders: [maintainers]
tags: [schema, criteria]
supersedes: []
superseded_by: []
created: 2026-08-23
updated: 2026-08-23
---

## Context

Pilotbook keeps acceptance criteria as prose under `## Acceptance criteria` in the markdown body. Backlog.md types them as `{index, text, checked}`. Several capabilities need a machine-readable set: UI checkboxes, a reviewer-owned verify gate that counts unchecked items, the coverage half of `pb analyze` (criteria with no covering task), and criterion-to-test binding (ADR-0006, US-024, US-025).

A heavier schema and a migration of existing story files is the cost. ADR-0001 still requires the files on disk to be the source of truth — structured criteria must live in a named body section that parse-then-serialize round-trips.

## Decision

Parse a named `## Acceptance criteria` checklist into structured `{index, text, checked}` at read time, and serialize it back as the same markdown checklist. Do not introduce a parallel frontmatter array. Ops (`analyze`, `verify`, UI) consume the parsed list; humans keep editing markdown.

`index` is 1-based parse order of checklist items (`- [ ]` / `- [x]`) under that heading. It is stable only until someone reorders the list. Reordering is a new index; ADR-0006 treats a broken `ID#N` token as `unbound-rename`, not a silent rematch by text.

A `## Acceptance criteria` section that is prose instead of a checklist is a lint **error** on stories with `created` after this ADR's `date`, and a lint **warning** on stories at or before that date. A story with no such section at all is a warning until a migration story lands.

This decision unblocks criterion coverage in `pb analyze`, reviewer-owned verify (US-019), UI checkboxes, and ADR-0006 / US-024 / US-025. Those MUST still not land until their own items are implemented; they MUST NOT invent a second criteria schema.

## Consequences

- `pb verify` can count unchecked criteria and refuse to tick a human-owned box.
- `pb analyze` can emit a coverage table keyed on criterion index.
- Existing story files already using `- [ ]` keep working; the parser is the checklist grammar.
- Grandfathered prose sections warn; new ones fail lint.
- Reordering a checklist is a deliberate event. Agents MUST NOT "fix" binds by fuzzy-matching criterion text.

## Alternatives considered

- Frontmatter `acceptance_criteria:` array — easier for JSON consumers, worse for git diffs and human editing, fights ADR-0001's "markdown is the chart".
- Leave criteria as freeform forever — `pb analyze` and reviewer-owned verify cannot be exact graph queries.
- Copy Backlog.md's YAML block inside the body — a second syntax for agents to invent.
- Forever-warning on prose — the graph quietly stops being queryable.

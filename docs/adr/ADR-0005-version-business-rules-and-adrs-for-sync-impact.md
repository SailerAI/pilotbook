---
id: ADR-0005
title: Version business rules and ADRs for sync-impact
type: adr
status: accepted
version: 1
date: 2026-08-23
deciders: [maintainers]
tags: [schema, rules]
supersedes: []
superseded_by: []
content_hash: 189e1b5e5242
created: 2026-08-23
updated: 2026-08-23
---
## Context

Business-rule files already have a `version` integer. ADRs do not. Spec Kit versions its constitution with semver plus a Sync Impact Report; it cannot tell you which shipped work a bump just invalidated. Pilotbook can: inbound `business_rules` and `adrs` edges from stories and tasks.

Sync-impact reporting needs a version bump to be a detectable event, plus an amended date so a brief can say "this rule moved after you shipped".

## Decision

Keep `version` as a monotonic integer on `business-rule` (already present) and add the same field to `adr`. Add optional `amended` (a date). Do **not** add `ratified`: `created` plus `status: accepted` is ratification.

A content-hash change of an active/accepted rule or ADR without a version bump is a lint error. `pb impact <ID>` (or `pb analyze --impact ID`) walks inbound edges and lists every story and task whose brief would change, flagging those already `done`.

The sync-impact query MUST NOT invent a second version scheme (semver, git blame, or an event log).

## Consequences

- Existing BRs keep `version: 1`; the first real edit that changes the rule body bumps to 2 and sets `amended`.
- ADRs gain `version`, defaulting to 1 on create.
- Complexity Tracking (`Violation | Why Needed | Simpler Alternative Rejected Because`) lives in the ADR body, not as a new type.
- `done` work is never silently rewritten; impact is a report, not a cascade of status changes.
- `business-rule` and `adr` persist a `content_hash` (sha256 of the markdown body, 12 hex characters) so the "body moved without a bump" check is a pure function of the files.
- `pb bump <ID>` is the version-bump operation: it increments `version`, sets `amended`, and refreshes `content_hash`. Lint reports the drift and never calls git.
- Existing rule and ADR files are backfilled with `content_hash` at their current body, without incrementing `version`.

## Alternatives considered

- A `ratified` date — redundant with `created` + `status: accepted`.
- Semver strings (`1.2.0`) — MAJOR/MINOR/PATCH is more ceremony than a graph of tens of rules needs; integer + amended date is enough.
- Git blame as the version — not queryable from the graph, and `pb brief` is a pure function of files.
- Event log of rule changes — contradicts ADR-0001.

---
id: ADR-0009
title: Maturity is derived never stored
type: adr
status: accepted
version: 2
date: 2026-08-25
deciders: [maintainers]
tags: [agents, profile]
supersedes: []
superseded_by: []
content_hash: a69e7f523c44
created: 2026-08-25
updated: 2026-08-25
amended: 2026-08-25
---
## Context

Discover, shape, architect, and implement must treat a greenfield repo and a 100-item repo differently. Storing `maturity:` on every item would rot, fight git diffs, and invent a field the lint schema does not have.

## Decision

Repo maturity is a pure function of files, config, and optional git metadata. `pb profile` derives `level` (`greenfield | shaping | operating | mature`) and `calibration` hints at read time. Item frontmatter MUST NOT gain a maturity or level field.

## Consequences

Skills start with `pb profile`. Tests inject a filesystem (and optional git stubs). A stale stored level cannot lie to the agent. Changing the derivation formula does not require rewriting existing items.

## Alternatives considered

- A `maturity` key on `pilotbook.config.yml` — a human would have to keep it honest; agents would trust it anyway.
- Inferring maturity only from git age — a cloned template with 200 commits and no Pilotbook graph is still greenfield for this product.

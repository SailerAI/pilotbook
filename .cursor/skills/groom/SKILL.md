---
name: groom
description: Find incomplete items and propose patches that make the graph agent-ready.
commands: [pb profile, pb lint, pb explain]
writes: [docs/**/*.md]
done: Every in-scope item has acceptance criteria or a rule statement, and lint warnings for missing links are addressed or explicitly deferred.
---

# groom

## Calibrate

`pb profile --json`. In a greenfield graph, flag missing criteria first. In a mature graph, flag `missing-evidence` and stale ADRs first.

## Scan

Work items (`status` in `backlog` or `todo`):

- Stories missing `## Acceptance criteria` checkboxes
- Stories with empty `business_rules` / `adrs` that clearly need them
- Promoted ideas with `missing-evidence`
- Tasks without `area`
- Stale `updated` dates relative to git history
- Dangling IDs (`pb lint`)

Propose patches as a reviewable diff.

## Do not

- Silently change priority or status.
- Invent IDs.

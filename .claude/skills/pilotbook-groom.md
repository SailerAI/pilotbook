---
name: groom
description: Find incomplete items and propose patches that make the graph agent-ready.
commands: [pb lint, pb explain]
writes: [docs/**/*.md]
done: Every in-scope item has acceptance criteria or a rule statement, and lint warnings for missing links are addressed or explicitly deferred.
---

# groom

Scan work items (`status` in `backlog` or `todo`) and flag:

- Stories missing `## Acceptance criteria` checkboxes
- Stories with empty `business_rules` / `adrs` that clearly need them
- Tasks without `area`
- Stale `updated` dates relative to git history
- Dangling IDs (`pb lint`)

Propose patches as a reviewable diff. Do not silently change priority or status.

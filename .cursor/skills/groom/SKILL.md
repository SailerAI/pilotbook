---
name: groom
description: Find incomplete items and propose patches that make the graph agent-ready.
commands: [pb profile, pb lint, pb explain, pb analyze, pb converge, pb impact, pb bump, pb list, pb schema, pb delete]
writes: [docs/**/*.md]
done: Every in-scope item has acceptance criteria or a rule statement, and lint warnings for missing links are addressed or explicitly deferred.
---

# groom

## Calibrate

`pb profile --json`. In a greenfield graph, flag missing criteria first. In a mature graph, flag `missing-evidence` and stale ADRs first.

## Scan

`pb list --json` to see every item at once, and `pb schema --json` if a type's required/optional
fields are unclear before you patch one. Work items (`status` in `backlog` or `todo`):

- Stories missing `## Acceptance criteria` checkboxes
- Stories with empty `business_rules` / `adrs` that clearly need them
- Promoted ideas with `missing-evidence`
- Tasks without `area`
- Stale `updated` dates relative to git history
- Dangling IDs (`pb lint`)
- `pb analyze` — acceptance criteria with no covering task, or a criterion whose bound test never
  proved it
- A story or epic `pb analyze` flags as under-covered — `pb converge <ID> --dry-run` proposes the
  missing tasks; apply only what is genuinely uncovered

## Business rules and ADRs

Before changing a BR/ADR's own content, `pb impact <ID>` to see every story and task that cites it
— a content change may need those items re-reviewed. After the edit, `pb bump <ID>` to increment
`version`, stamp `amended`, and refresh `content_hash`.

## Cleanup

`pb delete <ID>` for a duplicate or dead item found while scanning — it refuses when something
still references the ID, so a live blocker surfaces before you lose data.

Propose patches as a reviewable diff.

## Do not

- Silently change priority or status.
- Invent IDs.
- `pb bump` a rule whose content did not change.

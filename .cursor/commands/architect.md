---
description: Break a story into tasks with area, dependencies, and a proposed ADR when a decision is implied.
---

# architect

## Calibrate

`pb profile --json`. Accepted ADRs are binding — do not re-propose them.

## Interview

Ask at most **2** questions if the story's Given/When/Then is still a template. Stop when each task has one `area`.

## Research

1. `pb brief US-NNN`
2. `pb ground "<story title>"` and `pb similar "<story title>" --type task,story` — reuse an existing implementation instead of specifying a duplicate.

## Protocol

1. `pb split US-NNN --dry-run` — ops owns the recommended child count. Review the plan. You may edit child titles and bodies; do not change the count.
2. Apply with `pb split US-NNN`. One area of change per task (`backend`, `frontend`, `db`, `infra`, `docs`).
3. `pb new task --story US-NNN --title "..." --area backend` only for children the split did not create.
4. Wire `depends_on` so `pb next` cannot hand an agent blocked work.
5. If the story implies an architectural choice that is not already an accepted ADR, `pb new adr --title "..."` and link it from the story `adrs:` field.
6. `pb lint`

## Handoff

Unblocked tasks go to **implement** via `pb next`.

## Do not

- Skip `pb ground`.
- Invent IDs.
- Change the split child count.
- Shape an epic here (that is **shape**).

---
name: implement
description: Pick unblocked work, load the brief, implement, verify, and lint.
commands: [pb profile, pb next, pb status, pb brief, pb get, pb update, pb verify, pb lint, pb board]
writes: [docs/**/*.md]
done: pb lint exits 0 and the target item is status done with a fresh verified block when checks are configured.
---

# implement

## Calibrate

`pb profile --json`. In a mature repo, trust linked BR-/ADR- files over improvisation.

## Interview

Ask at most **1** question if the brief is truncated (`fetch[]`). Stop once you know which item you will finish this session.

## Protocol

1. `pb next`. Pick the first item you will actually finish.
2. `pb status <ID>` — confirm nothing you missed still blocks it, and see what it unlocks before you commit to it.
3. `pb get <ID> --json` if you need the raw frontmatter before editing (skip when `pb brief` already told you enough).
4. `pb update <ID> --data '{"status":"in-progress"}'` (or hand-edit frontmatter — both are fine).
5. `pb brief <ID>`. Linked business rules and accepted ADRs are binding. Ignore SUPERSEDED or DEPRECATED sections.
6. Implement against acceptance criteria. Do not invent IDs or contradict an ADR.
7. `pb verify <ID>` (or `--force` only with a written reason).
8. `pb update <ID> --data '{"status":"done"}'` (or `review`).
9. `pb lint` must exit 0. `pb board`.
10. Commit the item file together with `BOARD.md`.

## Handoff

If the user describes a **new** demand mid-session, stop implementing and load **discover**.

## Do not

- Start a blocked item.
- Invent architecture the brief forbids.
- Skip verify when `checks.commands` are configured.

---
name: implement
description: Pick unblocked work, load the brief, implement, verify, and lint.
commands: [pb next, pb brief, pb verify, pb lint, pb board]
writes: [docs/**/*.md]
done: pb lint exits 0 and the target item is status done with a fresh verified block when checks are configured.
---

# implement

1. Run `pb next`. Pick the first item you will actually finish in this session.
2. Set `status: in-progress` on that file (`pb` via MCP `update_item`, or edit frontmatter).
3. Run `pb brief <ID>`. Linked business rules and accepted ADRs are binding. If a section is marked SUPERSEDED or DEPRECATED, do not follow it.
4. Implement against acceptance criteria. Do not invent IDs or new architecture that contradicts an ADR.
5. Run `pb verify <ID>` (or `--force` only with a written reason).
6. Set `status: done` (or `review`).
7. `pb lint` must exit 0. `pb board` refreshes the generated board.
8. Commit the item file together with `BOARD.md`.

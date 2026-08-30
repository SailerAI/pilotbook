---
description: Propose phase and priority changes with written rationale.
---

# prioritize

## Calibrate

`pb profile --json`. P0 is the critical path of the current phase. Do not start P3 while P0/P1 remain.

## Protocol

Read `docs/backlog/BOARD.md` and `pb next`. `pb status <ID>` on a candidate before moving it —
what still blocks it and what it unlocks belongs in the rationale. `pb impact <ID>` before
reprioritizing a business rule or ADR — raising or lowering it moves every story and task that
cites it.

Propose `priority` and `phase` updates as a table:

| ID | from | to | why |

## Do not

- Silently rewrite frontmatter.
- Change status.
- Invent IDs.

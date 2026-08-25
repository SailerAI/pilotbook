---
name: prioritize
description: Propose phase and priority changes with written rationale.
commands: [pb profile, pb next, pb lint]
writes: [docs/backlog/**/*.md]
done: A markdown summary of proposed changes exists; no priority is changed without a sentence of rationale.
---

# prioritize

## Calibrate

`pb profile --json`. P0 is the critical path of the current phase. Do not start P3 while P0/P1 remain.

## Protocol

Read `docs/backlog/BOARD.md` and `pb next`.

Propose `priority` and `phase` updates as a table:

| ID | from | to | why |

## Do not

- Silently rewrite frontmatter.
- Change status.
- Invent IDs.

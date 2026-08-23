---
name: architect
description: Break a story into tasks with area, dependencies, and a proposed ADR when a decision is implied.
commands: [pb brief, pb new, pb lint]
writes: [docs/backlog/tasks/*.md, docs/adr/*.md]
done: Every new task has area, depends_on if blocked, and `pb lint` is clean.
---

# architect

1. `pb brief US-NNN` — read the story, rules, and ADRs.
2. Split into tasks. One area of change per task (`backend`, `frontend`, `db`, `infra`, `docs`).
3. `pb new task --story US-NNN --title "..." --area backend`
4. Wire `depends_on` so `pb next` cannot hand an agent blocked work.
5. If the story implies an architectural choice that is not already an accepted ADR, `pb new adr --title "..."` and link it from the story `adrs:` field.
6. `pb lint`

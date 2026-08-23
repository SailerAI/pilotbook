---
name: architect
description: Break a story into tasks with area, dependencies, and a proposed ADR when a decision is implied.
commands: [pb brief, pb split, pb new, pb lint]
writes: [docs/backlog/tasks/*.md, docs/adr/*.md]
done: Every new task has area, depends_on if blocked, and `pb lint` is clean.
---

# architect

1. `pb brief US-NNN` — read the story, rules, and ADRs.
2. `pb split US-NNN --dry-run` — ops owns the recommended child count. Review the plan. You may edit child titles and bodies; do not change the count.
3. Apply with `pb split US-NNN` (no confirmation prompt). One area of change per task (`backend`, `frontend`, `db`, `infra`, `docs`).
4. `pb new task --story US-NNN --title "..." --area backend` only for children the split did not create.
5. Wire `depends_on` so `pb next` cannot hand an agent blocked work.
6. If the story implies an architectural choice that is not already an accepted ADR, `pb new adr --title "..."` and link it from the story `adrs:` field.
7. `pb lint`

# Ship

Turn an unblocked task into verified code. The **implement** skill owns this loop.

```bash
pb next
pb brief TASK-001
pb verify TASK-001
pb lint
pb board
```

## 1. Pick work

```bash
pb next
```

Prints unblocked epic/story/task rows, ordered by a fixed **ladder**, then phase (ascending), then priority (`P0` before `P3`), then estimate, then id.

| Ladder | Status |
| --- | --- |
| `resume` | `in-progress` |
| `review` | `review` |
| `ready` | `todo` |
| `backlog` | `backlog` |

Cancelled and rejected items are out. An item whose `depends_on` are not `done` or `cancelled` is **blocked** and will not appear.

Set `status: in-progress` on the file you will finish (edit frontmatter, or MCP `update_item`). Do not move the file.

See why something is stuck:

```bash
pb status TASK-001
pb explain TASK-001
```

`status` shows `requires`, `missingDeps`, and `unlocks`. `explain` adds parent, children, and a short note.

## 2. Load the brief

```bash
pb brief TASK-001
```

You should see sections ordered by authority: business rules, ADRs, the target, parents, then dependencies. Linked rules and accepted ADRs are **binding**. If a section is marked SUPERSEDED or DEPRECATED, do not follow it.

```bash
pb brief TASK-001 --budget 4000
pb brief TASK-001 --format json
```

Details: [The brief](./brief.md).

## 3. Implement

Work against the acceptance criteria. Do not invent IDs. Do not contradict an accepted ADR. One area of change per task (`backend`, `frontend`, `db`, `infra`, `docs`).

If the story is too large, **architect** runs `pb split US-NNN --dry-run`, then `pb split US-NNN`. That is not the ship loop's first move.

## 4. Verify

```bash
pb verify TASK-001
```

Runs every command in `checks.commands`, then stamps a `verified` block on the task (hash of the item). `--force` sets `bypassed: true` — only with a written reason.

If `checks.commands` is empty, verify still stamps a hash so the PR shows evidence.

Trust: those commands run at the same level as `package.json` scripts. They are not sandboxed. See [SECURITY.md](../SECURITY.md) and [Verify](./verify.md).

Then set `status: done` (or `review`).

## 5. Lint and board

```bash
pb lint
pb board
```

`pb lint` must exit 0. If checks are configured, a `done` task without a fresh `verified` block is `unverified-done`. Changing the task after verify is `stale-verified`.

`pb board` regenerates `docs/backlog/BOARD.md`. Commit the item file together with the board.

```bash
pb board --dry-run
```

Reports `in_sync`, `added`, and `orphans` without writing.

## Coverage

After a story ships, or during grooming:

```bash
pb analyze
pb converge US-001 --dry-run
```

`analyze` exits 1 when active rules lack covering tasks, or done stories have open children. `converge` appends tasks for uncovered acceptance criteria. See [Verify](./verify.md).

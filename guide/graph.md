# Graph, edges, and BOARD.md

Items are nodes. Frontmatter arrays (and a few scalars) are edges. `pb lint` checks they exist, have the right type, and do not cycle.

## Edge kinds

| Field | Points at | Blocking | Acyclic | Notes |
| --- | --- | --- | --- | --- |
| `depends_on` | epic, story, task | yes | yes | Unresolved deps block `pb next` |
| `business_rules` | business-rule | no | no | Inherited into the brief |
| `adrs` | adr | no | no | Inherited into the brief |
| `related` | any type | no | no | |
| `promoted_to` | epic, story, task, BR, ADR | no | no | Written by `pb promote` |
| `supersedes` | adr | no | yes | |
| `superseded_by` | adr | no | no | |
| `epic` | epic | no | no | Scalar parent on stories |
| `story` | story | no | no | Scalar parent on tasks |

`depends_on` that are not `done` or `cancelled` make the item **blocked**. Remote refs `repo#ID` never block local `itemState`; they still lint against a [peer manifest](./interop.md).

## Navigate

```bash
pb explain US-001
```

Prints `status`, `parent`, `blocked by`, `blocks`, `children`, and a one-line note (`Cannot start: waiting on …` or `Unblocked and ready to start.`).

```bash
pb status              # ready list
pb status TASK-001     # requires, missing, unlocks
pb next                # unblocked work, ladder then phase/priority
```

`status` of one ID:

- `requires` — each `depends_on` with computed state (`ready`, `blocked`, `done`, `cancelled`, `missing`, `remote`)
- `missingDeps` — local deps that are missing or unresolved
- `unlocks` — items that list this ID in `depends_on`

## Board

```bash
pb board
pb board --dry-run
```

Writes `docs/backlog/BOARD.md` (path is `root` + `board` in config). Dry-run reports:

- `in_sync` — generated board would match the file
- `added` — items on disk that are not on the board
- `orphans` — board rows whose files are gone

Commit `BOARD.md` with the item files that changed it.

## Graphviz

```bash
pb graph --dot > graph.dot
dot -Tsvg graph.dot -o graph.svg
```

Nodes are items; edge labels are the field name except `depends_on`.

## Search

```bash
pb search ledger
pb search TASK-001
```

Substring match on id, title, then body. Title/id hits first. Empty or whitespace query → no hits. There is no type filter in the shipped CLI.

## Seed from a brief

```bash
pb seed --from brief.md --dry-run
pb seed --from brief.md
```

Headings become items:

```markdown
# Epic: Ledger
goal: Double-entry stays consistent

## Story: Post a transfer

### Task: Ledger schema
area: db
```

Use `# Epic: …`, `## Story: …`, `### Task: …` (or those prefixes on other heading levels). Stories need an epic in the same file. `--dry-run` prints the plan without allocating IDs.

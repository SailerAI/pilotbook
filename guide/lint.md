# Lint

`pb lint` is referential integrity over the markdown graph. It is not Biome. In this repo, `pnpm lint` is style; `pnpm pb lint` is the graph.

```bash
pb lint
pb lint --format github
pb lint --json
```

Exit **0** if there are no errors. Warnings do not fail the process. `--format github` prints Workflow commands:

```text
::error file=docs/backlog/tasks/TASK-001.md,line=4,col=1,title=dangling-ref::dangling depends_on US-999
```

Every diagnostic has `file:line:col` (and often `suggestion` / `fix`).

## Errors

| Code | When |
| --- | --- |
| `parse-error` | YAML/markdown could not be read |
| `duplicate-id` | Same `id` in two files |
| `unknown-type` | Folder/type not in config |
| `missing-field` | Required frontmatter key empty |
| `unknown-field` | Key not in the type schema |
| `type-mismatch` | `type:` does not match the folder type |
| `bad-id` | Id fails the prefix/pad pattern |
| `filename-mismatch` | File is not `{id}-<slug>.md` |
| `invalid-enum` | Status, priority, area, … not in the allow-list |
| `not-array` | Field must be an inline YAML array |
| `not-number` | Field must be a number |
| `not-date` | Field must be `YYYY-MM-DD` |
| `dangling-ref` | Parent, edge, or `covers` target missing |
| `wrong-type-ref` | Ref exists but is the wrong type |
| `dependency-cycle` | Cycle in `depends_on` |
| `edge-cycle` | Cycle in another acyclic edge (e.g. `supersedes`) |
| `unverified-done` | Work item `done` with no `verified` block (when `checks.commands` is set) |
| `stale-verified` | Item changed since `pb verify` |
| `stale-content-hash` | Accepted ADR / active BR body does not match `content_hash` — run `pb bump` |

## Warnings

| Code | When |
| --- | --- |
| `open-children` | Epic/story is `done` but children are not done/cancelled |
| `superseded-status` | ADR has `superseded_by` but status is not `superseded` |
| `deprecated-adr` | ADR `status: deprecated` |
| `deprecated-rule` | Rule `status: deprecated` |
| `parentless-task` | Task has no story and is P0 or estimate ≥ 3 |
| `unbound-criterion` | `covers` is not `ID#N` or `N` is out of range |

Fix IDs and edges; do not delete diagnostics by moving files. After a body edit on an accepted ADR or active rule:

```bash
pb bump ADR-0001
```

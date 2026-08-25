# Verify, analyze, converge

Proof that work is done lives in git: a content hash in frontmatter, optional JUnit, and covering tasks for each criterion.

## Verify

```bash
pb verify TASK-001
pb verify TASK-001 --force
```

1. Runs each string in `checks.commands` as an argv (no shell interpolation).
2. Optionally reads `checks.report` (repo-relative JUnit XML) afterward.
3. Stamps `verified: { at, checks, hash }` on the item.
4. Reloads and refreshes the board.

`--force` sets `bypassed: true` when you must skip failing checks. Write down why.

`--json` includes `results` (`{ name, classname, status, time }` per test) and `reportStale` when the JUnit file was not rewritten by this run. A missing or corrupt report is not an error — `results` is empty.

If `checks.commands` is empty, verify still stamps a hash.

### Trust boundary

Commands run at the same trust level as `package.json` scripts. They are **not sandboxed**. Do not point `checks.commands` at untrusted input. See [SECURITY.md](../SECURITY.md).

### Config

```yaml
checks:
  commands: [pnpm test, pnpm lint]
  report: .pb/junit.xml
```

When commands are configured, `status: done` without a `verified` block is lint error `unverified-done`. Editing the item after verify is `stale-verified` until you verify again.

## Analyze

```bash
pb analyze
pb analyze --json
```

Coverage table without an LLM:

| Column | Meaning |
| --- | --- |
| Requirement Key | Story/epic criterion or a rule/ADR id |
| Has Task? | A non-cancelled task lists that key |
| Task IDs | Covering tasks |
| Proved? | For `ID#N` rows: a passing JUnit test mentions that exact token |
| Test | Matching test name |
| Notes | Gaps |

- `coveragePercent` — share of rows that have a covering **task**
- `provedPercent` — share of acceptance-criteria rows with a passing bound `ID#N` test
- JSON adds `proved` / `unproven` arrays of `{ id, index, test?, status? }`

Matching is the exact token `ID#N` in JUnit `classname + " " + name`. `fail`, `error`, and `skipped` count as unproven. Rule and ADR rows are not machine-ownable.

Exit **1** when the graph is not ok (uncovered active rules, or done stories with open children).

Name tests after the criterion they prove:

```ts
it("US-001#2 rejects a float amount", () => { /* … */ });
```

## Converge

```bash
pb converge US-001 --dry-run
pb converge US-001
pb converge EPIC-001
```

Appends tasks for acceptance criteria that have no covering `covers: [ID#N]` task. `--dry-run` prints a plan (`converged` or `plan` + titles). It does not rewrite existing tasks.

## Covers

On a task:

```yaml
covers: [US-001#1, US-001#2]
```

`N` is the 1-based index of checkboxes under `## Acceptance criteria` on that story (or the target id). See [ADR-0007](../docs/adr/ADR-0007-bind-a-task-to-an-acceptance-criterion.md).

## Bump

```bash
pb bump BR-001
pb bump ADR-0001
```

Increments `version`, sets `amended` to today, refreshes `content_hash`. Use after you change the body of an active rule or accepted ADR. If the body is unchanged, you get a warning instead of a bump.

## Impact

```bash
pb impact BR-001
```

Lists stories and tasks that cite that rule or ADR (inbound edges), with status and whether they are done.

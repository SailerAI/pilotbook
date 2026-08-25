# CI

Graph integrity belongs in the pull request, next to the markdown that changed.

## Lint

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 20
- run: npx pilotbook lint --format github
```

`--format github` emits annotations:

```text
::error file=docs/backlog/tasks/TASK-001.md,line=12,col=1,title=dangling-ref::dangling depends_on US-999
```

Exit 1 on errors. Warnings are annotations with `::warning` and do not fail the job.

This repository also runs `pnpm pb lint` after `pnpm build` (local binary). Consumers typically use `npx pilotbook`.

## Verify in PRs

Stamp `verified` on the task you claim is done, and commit that frontmatter. Reviewers see the hash in the diff.

If `checks.commands` is set, `status: done` without `verified` is `unverified-done`. Changing the item after verify is `stale-verified`.

Optional: run the same commands CI already runs, then `pb verify TASK-NNN` so the hash matches a green suite. JUnit at `checks.report` feeds `pb analyze` proved-criteria matching — name tests `US-001#2 …`.

## Hook stop

`hooks.block_on_unverified: true` makes `pb hook stop` exit 2 when in-progress work has no `verified` block. Useful as a Claude Code / Cursor stop hook; not a replacement for CI lint.

## Analyze

```yaml
- run: npx pilotbook analyze
```

Fails the job when active rules lack covering tasks or done stories still have open children. Pair with lint.

## What not to do

Do not run `pb sync --dry-run=false` in CI unless you intend to mutate Notion. Dry-run is the default; keep it that way on untrusted events. See [Sync with Notion](./notion-sync.md).

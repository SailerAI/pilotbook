---
name: commit
description: >-
  Commits only files changed in the current AI conversation, branches from
  main, runs tests, linting, Prettier, and other checks, leaves unrelated
  work unstaged, and opens a PR to main using .github/PULL_REQUEST_TEMPLATE.md.
  Use when the user asks to commit, commit the session, ship conversation
  work, open a PR for this chat, or wrap up an AI coding session.
---

# Commit

Branch out from main, run tests, verify linting, Prettier, and others, only commit items changed in the conversation, leave other chunks of work untouched and unstaged, never exclude items you haven't changed. Then open the PR to main using `.github/PULL_REQUEST_TEMPLATE.md`.

## Conversation set (source of truth)

The commit set is **files this conversation created, edited, or deleted** — from your Write / StrReplace / EditNotebook / Delete / Shell writes, plus formatter fixes on those same paths.

- Do **not** use `git status` as the commit set. Status is a superset that may include other work.
- Do **not** omit any conversation-changed file. Commit the complete conversation set.
- Do **not** stage files this conversation did not change, even if they are dirty or look related.
- Leave other chunks of work **untouched and unstaged**. Never exclude items you haven't changed: no extra `.gitignore` entries, no `git update-index --assume-unchanged` / `--skip-worktree`, no `git add` pathspec excludes (`':!…'`), no stash of leftover files. They stay visible in `git status`.
- If conversation changes are already mixed into commits with unrelated work, **stop** and say so. Do not rewrite or split those commits.

## Git safety

Follow the user's git commit and PR rules. In particular:

- Never `git add -A`, `git add .`, or `git commit -a`. Stage **explicit paths** only.
- Never `--no-verify`, `--no-gpg-sign`, `-i` / `--interactive`, force push, or hard reset.
- Never `git commit --amend` unless the user asked and the amend conditions in the commit rule are met.
- Never update git config. Never skip hooks.
- Do not commit secrets (`.env`, credentials) or gitignored build output (`dist`, `coverage`, `.nuxt`, `.output`).
- Do not use TodoWrite or Task while creating the PR.

## Workflow

Copy and track:

```
- [ ] 1. Inventory
- [ ] 2. Branch from main
- [ ] 3. Checks
- [ ] 4. Commit conversation set
- [ ] 5. Push and open PR
```

### 1. Inventory

Run in parallel:

```bash
git status
git diff && git diff --staged
git log -8 --oneline
git rev-parse --abbrev-ref HEAD
git fetch origin main
```

Build the conversation path list. Cross-check against status: every conversation path should appear as modified, added, deleted, or untracked. If a conversation file is missing from disk, stop.

If the conversation set is empty, stop. Do not commit unrelated work.

### 2. Branch from main

Reuse the current branch only if **this conversation** created it from `main` / `origin/main`.

Otherwise:

```bash
git checkout -b <branch> origin/main
```

Name the branch from the backlog id when there is one (`task-013-category-crud-api`), else a short slug for the session.

If checkout fails because of local changes, **stop**. Do not `-f`, do not stash leftover work, do not discard anything.

Uncommitted files (conversation and otherwise) should carry over. Confirm leftover files are still unstaged.

### 3. Checks

Run tests, verify linting, Prettier, and others **before** commit. Scope to workspaces and files in the conversation set. Do not format or lint the rest of the tree if that would rewrite files you did not change.

Discover commands from the affected workspace `package.json` and repo configs:

| Kind | How to find | How to run |
| --- | --- | --- |
| Tests | `test` script | `npm test -w <workspace>` (backend / frontend / website as touched) |
| Lint | `lint` script or ESLint config | that script, or ESLint on conversation files only |
| Prettier | `format` / `prettier` script, `prettier` dependency, or Prettier config | `prettier --check` on conversation files; `--write` **only** those files if check fails on format |
| Others | `typecheck`, `vue-tsc`, `tsc`; backlog files → backlog lint | run what exists for the touched area |

Known fallbacks in this repo:

- Backend: `npm test -w backend`
- Frontend: `npm run lint -w frontend`; `npm test -w frontend` if present
- Website: `npm test -w website` if present
- Backlog / docs ids: `node tools/backlog/backlog.mjs lint` then `node tools/backlog/backlog.mjs board` if you changed backlog files
- Prettier: skip if not configured; do not add Prettier as a dependency from this skill

If a check auto-fixes files, restage **only** conversation paths that it changed. If a check fails in code this conversation did not touch, stop and report; do not "fix" other chunks of work.

Do not commit if tests or required checks are red.

### 4. Commit conversation set

```bash
git add -- path1 path2 path3
git diff --staged
```

Confirm the staged diff is exactly the conversation set (adds, mods, and deletions). Then commit:

```bash
git commit -m "$(cat <<'EOF'
Short why-focused subject.

Optional body: what the session delivered and the backlog id.
EOF
)"
```

Match recent `git log` style. Prefer why over what. Afterward: `git status` — leftover work must still be unstaged; the conversation set must not remain dirty.

### 5. Push and open PR

```bash
git push -u origin HEAD
```

Read `.github/PULL_REQUEST_TEMPLATE.md` and fill every section from this session (do not leave the template comments as the body). Check off Test plan items you actually ran. Then:

```bash
gh pr create --base main --title "the pr title" --body "$(cat <<'EOF'
## Summary
- …

## Test plan
- [x] …

## Checklist
- [x] …
EOF
)"
```

Return the PR URL. Do not merge.

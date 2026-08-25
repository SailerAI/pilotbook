# The brief

`pb brief <ID>` compiles a context pack from the graph. That pack is what an agent should read instead of opening one task file and guessing the architecture.

```bash
pb brief TASK-001
pb brief TASK-001 --budget 4000
pb brief TASK-001 --format json
```

`--json` on the root command also forces JSON. `--format json` is the same payload.

## Authority order

Sections are sorted so the most binding material is first:

1. Business rules (`rule`, `related-rule`)
2. ADRs (`adr`, `adr-chain`)
3. The target item
4. Parents (story → epic, …)
5. `depends_on` (and everything else)

A line in a brief must change agent behaviour ([BR-003](../docs/business-rules/BR-003-a-brief-line-must-change-agent-behaviour.md)). Linked **active** rules and **accepted** ADRs win over improvisation.

## What is walked

Starting at the target:

- Full body of the target
- Parent chain at **criteria** depth (acceptance criteria, Outcome, or Scope)
- `business_rules` and `adrs` on the target and its nearest parent, at **statement** depth (Rule / Decision / first paragraph)
- Related rules; ADR supersede chain at **title** depth
- `depends_on` transitively at **title** depth
- Done siblings that share a parent, title only
- `code_map` paths whose key matches the task `area` or a tag

## Depths

| Depth | Body included |
| --- | --- |
| `full` | Entire markdown body |
| `criteria` | Acceptance criteria, Outcome, or Scope |
| `statement` | Rule, Decision, or first paragraph |
| `title` | Frontmatter only (no body) |

## Budget and truncation

`--budget` is a token ceiling (characters / 4). When the pack would exceed it, lower-priority sections drop to `fetch` stubs instead of disappearing.

JSON fields:

- `truncated` — true if the budget cut anything
- `tokens` / `fullTokens` — used vs unbounded
- `dropped` — `{ id, title, role }`
- `fetch` — `{ id, title, fetch }` so the agent can pull the rest
- `diagnostics` — includes `brief_truncated` (warning, never silent)

Session-start hooks use `hooks.prime_budget` (default **6000**). Same truncation rules.

## Contradictions

The brief prepends warnings you must not ignore:

- `SUPERSEDED by ADR-NNNN — do not follow this decision.`
- `DEPRECATED — treat as historical only.`
- `REJECTED — this decision was not taken.`
- `DEPRECATED rule — do not enforce.`

## Example

```text
# Brief: TASK-001

### BR-001 — Money is a string
_rule · business-rule · active_

JSON money MUST be a string. MUST NOT be a float.

### ADR-0001 — Numeric money
_adr · adr · accepted_

Store money as decimal strings.

### TASK-001 — Transaction API
_target · task · todo_
…
```

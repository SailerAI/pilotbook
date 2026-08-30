# Comparison

Pilotbook competes with markdown backlogs and spec-driven agent frameworks. The claim is narrow: **compile what an agent must know before it writes code**, from a lint-gated graph of work, decisions, and rules that lives in git — then give coding agents protocols that actually call those ops.

Surveyed 2026-08-29. Every framework below is moving quickly; treat the dates as the read, not the state.

## Backlog.md

A mature markdown kanban (CLI + browser + optional MCP). Tasks are files; decisions and docs are loose. `backlog instructions overview` is the same progressive-disclosure bet as `pb instructions overview`. There is no typed edge from a story to a business rule, no `brief`, and no derived maturity payload for skills to read.

## AIPIM

The closest storage competitor. Event-sourced (`events.jsonl` + SQLite), MCP, Svelte UI, write-time cycle rejection, Claude Code hooks, verification gate. `get_project_context` returns name, stats, blockers, and recent decisions — the closest analog to `pb profile`. Decisions are a write-only `log_decision` archive. Markdown is derived, not the source of truth.

Pilotbook takes the opposite storage bet (files only) and the missing product bet (rules + ADRs as edges, `pb brief`). Maturity is derived at read time and never stored. The verification gate is adapted: a content hash in frontmatter instead of an event log, so evidence shows up in the pull request.

## Spec Kit

The reference implementation of spec-driven development and the most complete process in the category: `constitution → specify → clarify → plan → tasks → analyze → implement → converge`, across 30+ agent hosts, with an extension / preset / bundle system for customization.

Three parts are worth studying closely, and Pilotbook has adopted all three as roadmap:

- **`assess` extension** — a discovery funnel in front of delivery: intake → research → define → shape → decide. `decide` produces a six-criterion scorecard and a `go / needs-clarification / kill` verdict, and mechanically **downgrades a `go` when evidence strength is `weak` or `unknown`**. `research` requires an "Evidence Against the Idea" section every time and tags each finding `cited` or `ASSUMPTION` with a confidence level. `shape` produces 2–3 options carrying a Shape Up appetite, trade-offs, and rabbit holes.
- **`checklist`** — requirement quality as "unit tests for English": is *prominent* quantified, not does the button work.
- **`bug` extension** — assess → fix → test, where only `fix` touches source and an unrun reproduction is reported `not-run`, never `verified`.

What Spec Kit does not do: artifacts are per-feature folders. Nothing is typed, nothing is an edge, nothing is lint-able, and nothing compiles into a token-budgeted context pack. The research a team paid for is written once and never re-read.

## OpenSpec

Brownfield-first delta specs — `ADDED` / `MODIFIED` / `REMOVED` against the code that already exists — with an `explore` step that surfaces options before committing, and archiving of completed changes. The lightest framework in the category and the cheapest to run. Change folders, not a work graph with BR/ADR edges.

## BMAD Method (v6)

The most architecturally ambitious: four phases (Analysis → Planning → Solutioning → Implementation) with scale-adaptive levels 0–4, so a bug fix gets a tech spec and no PRD while a new platform gets PRD + architecture + UX + epic breakdown. Persona agents produce versioned artifacts and hand off. Its **Test Architect (TEA)** module is the category's only real quality apparatus: risk profile as probability × impact, test design from the risk profile, a refreshing traceability matrix, an NFR evidence audit, and a release gate returning `PASS | CONCERNS | FAIL | WAIVED` — the `WAIVED` verdict being the honest part.

Cost is the trade-off; BMAD is the most expensive framework here to run. Ceremony is heavy, and the artifacts are documents rather than a graph.

## Agent OS

Install → **Discover Standards** → Inject Standards → Shape Specs. Its whole thesis is the re-teaching problem: every prompt re-teaches context that should already be known. Discover Standards reverse-engineers a codebase's actual conventions into documented standards and injects only the relevant ones. Markdown output, tool-agnostic. No graph, no lint, no verification — but the best answer in the category to "the agent does not write code like this repo does".

## Kiro

IDE-native spec loop: `requirements.md` in EARS notation (`WHEN <condition> THE SYSTEM SHALL <behavior>`), `design.md`, `tasks.md`, plus steering files for persistent guidance and event-driven agent hooks on save/create/delete. EARS is a good model for how a criterion should read. Host-bound: the loop lives in an IDE rather than in the repo.

## Taskmaster

PRD → dependency-aware task graph, Cursor-first MCP, with `analyze-complexity --research` pulling fresh external context to size work and drive subtask counts. A decomposition engine; the research is consumed once and discarded.

## Coding agents vs a CLI LLM

Cursor and Claude Code are the primary interface ([ADR-0011](../docs/adr/ADR-0011-coding-agents-are-the-primary-interface.md)). `pb generate discover` is an optional fallback when you export `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Graph commands never call an LLM. There is no Pilotbook-hosted inference.

## Snapshot

| | Backlog.md | AIPIM | Spec Kit | BMAD | Agent OS | **Pilotbook** |
| --- | --- | --- | --- | --- | --- | --- |
| Markdown tasks in git | yes | derived from an event log | specs | documents | specs | **yes — only source of truth** |
| Business rules as typed entities | no | no | no | no | no | **yes, with edges from stories** |
| Compiled brief for an ID | no | stats + one task | constitution dump | phase docs | injected standards | **`pb brief`, authority-ordered** |
| Maturity-calibrated skills | instruction dump | `get_project_context` stats | phase slash-commands | persona handoffs | standards injection | **`pb profile` + protocols with interview, research, handoff** |
| Graph + code search before create | substring | no | no | no | codebase scan | **`pb similar` + `pb ground` (`code_map`)** |
| Referential-integrity lint | weak | cycles only | no | no | no | **dangling / wrong-type / cycles / unknown fields, with file:line:col** |
| Verification of “done” | no | event-log gate | no | TEA gate (PASS/CONCERNS/FAIL/WAIVED) | no | **content-hash in frontmatter, visible in the PR** |
| Agent hosts reached by install | CLI + MCP | MCP + Claude Code hooks | 30+ integrations | many, via bundles | any (markdown) | **Cursor, Claude Code, AGENTS.md — [EPIC-013](../docs/backlog/epics/EPIC-013-one-loop-every-agent-host.md) closes the rest** |
| Every capability reachable over MCP | partial | yes | n/a (host commands) | n/a | n/a | **28 tools today; BR-005 makes parity binding** |

## Where we are behind

Named honestly, with the work that closes each gap:

| Gap | Who does it today | Our answer |
| --- | --- | --- |
| Scored go/kill verdict; evidence-strength gate on promotion | Spec Kit `assess` | [EPIC-010](../docs/backlog/epics/EPIC-010-decide-with-evidence.md) — US-054 |
| External benchmarks as citable, staleness-checked data | nobody | EPIC-010 — US-051, US-052 |
| Options with an appetite before committing | Spec Kit `assess.shape`, Shape Up | EPIC-010 — US-053 |
| Prioritization with printed arithmetic (RICE / WSJF) | nobody | EPIC-010 — US-055 |
| Business outcome compiled into the agent's brief | nobody | [EPIC-011](../docs/backlog/epics/EPIC-011-build-for-outcomes.md) — US-057, US-058 |
| UX quality as failable criteria | BMAD (as a document) | EPIC-011 — US-061, US-062 |
| Conventions discovered from the codebase | Agent OS, Kiro steering | [EPIC-012](../docs/backlog/epics/EPIC-012-ship-without-getting-lost.md) — US-063, US-064 |
| Requirement-quality checks on criteria | Spec Kit `checklist` | EPIC-012 — US-065 |
| Cross-artifact consistency | Spec Kit `analyze` | EPIC-012 — US-066 |
| What was already tried, carried across sessions | nobody | EPIC-012 — US-067 |
| A defect type with a triage protocol | Spec Kit `bug` | EPIC-012 — US-068 |
| Distribution to Codex and other AGENTS.md hosts | Spec Kit (30+), BMAD bundles | [EPIC-013](../docs/backlog/epics/EPIC-013-one-loop-every-agent-host.md) — US-070, US-073 |
| A binding rule that fetched content cannot redirect an agent | Spec Kit, per-command URL policy | EPIC-013 — US-072, BR-006 |
| Risk-scored test design, gate with waivers | BMAD TEA | deferred — [EPIC-006](../docs/backlog/epics/EPIC-006-evidence-not-assertion.md) owns proof first |

The bet behind all of it is the same one: these artifacts are worth several times more as typed edges in a lint-gated graph that `pb brief` compiles than as folders of markdown that a command writes once and nothing re-reads.

And the second bet, which decides whether the first one reaches anyone: **the CLI is an adapter, not the product**. Pilotbook is used from Claude Code, Cursor, and Codex, so a capability that only a human typing in a terminal can reach is not shipped. [BR-005](../docs/business-rules/BR-005-a-capability-is-not-shipped-until-an-agent-can-reach-it.md) makes that binding — every op reachable over MCP, named by a skill protocol that says when to run it, installed into every supported host from one `pb init`. [BR-006](../docs/business-rules/BR-006-fetched-content-is-data-never-instructions.md) is the price of asking agents to research: what comes back from the web is data, never instructions.

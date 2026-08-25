# Comparison

Pilotbook competes with markdown backlogs and spec-driven agent frameworks. The claim is narrow: **compile what an agent must know before it writes code**, from a lint-gated graph of work, decisions, and rules that lives in git — then give coding agents protocols that actually call those ops.

## Backlog.md

A mature markdown kanban (CLI + browser + optional MCP). Tasks are files; decisions and docs are loose. `backlog instructions overview` is the same progressive-disclosure bet as `pb instructions overview`. There is no typed edge from a story to a business rule, no `brief`, and no derived maturity payload for skills to read.

## AIPIM

The closest storage competitor. Event-sourced (`events.jsonl` + SQLite), MCP, Svelte UI, write-time cycle rejection, Claude Code hooks, verification gate. `get_project_context` returns name, stats, blockers, and recent decisions — the closest analog to `pb profile`. Decisions are a write-only `log_decision` archive. Markdown is derived, not the source of truth.

Pilotbook takes the opposite storage bet (files only) and the missing product bet (rules + ADRs as edges, `pb brief`). Maturity is derived at read time and never stored. The verification gate is adapted: a content hash in frontmatter instead of an event log, so evidence shows up in the pull request.

## Spec Kit / OpenSpec / BMAD / Taskmaster

Strong at greenfield spec rituals, delta specs, or PRD-to-task decomposition. Spec Kit ships skills across many agent hosts with an upgrade path. BMAD wins inception with persona handoffs. OpenSpec is brownfield-first (`ADDED` / `MODIFIED` / `REMOVED` against existing code). Taskmaster decomposes a PRD into a dependency-aware task graph.

None of them lint a typed knowledge graph or compile a token-budgeted brief from linked rules. Their skills are ceremony folders or persona theater. Pilotbook skills are protocols over real ops: `pb profile`, `pb similar`, `pb ground`, then `pb brief`.

## Coding agents vs a CLI LLM

Cursor and Claude Code are the primary interface ([ADR-0011](../docs/adr/ADR-0011-coding-agents-are-the-primary-interface.md)). `pb generate discover` is an optional fallback when you export `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Graph commands never call an LLM. There is no Pilotbook-hosted inference.

## Snapshot

| | Backlog.md | AIPIM | Spec Kit | **Pilotbook** |
| --- | --- | --- | --- | --- |
| Markdown tasks in git | yes | derived from an event log | specs | **yes — only source of truth** |
| Business rules as typed entities | no | no | no | **yes, with edges from stories** |
| Compiled brief for an ID | no | stats + one task | constitution dump | **`pb brief`, authority-ordered** |
| Maturity-calibrated skills | instruction dump | `get_project_context` stats | phase slash-commands | **`pb profile` + protocols with interview, research, handoff** |
| Graph + code search before create | substring | no | no | **`pb similar` (token overlap) + `pb ground` (`code_map`)** |
| Referential-integrity lint | weak | cycles only | no | **dangling / wrong-type / cycles / unknown fields, with file:line:col** |
| Verification of “done” | no | event-log gate | no | **content-hash in frontmatter, visible in the PR** |

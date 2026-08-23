# Comparison

Pilotbook competes with markdown backlogs and spec-driven agent frameworks. The claim is narrow: **compile what an agent must know before it writes code**, from a lint-gated graph of work, decisions, and rules that lives in git.

## Backlog.md

A mature markdown kanban (CLI + browser + optional MCP). Tasks are files; decisions and docs are loose. There is no typed edge from a story to a business rule, and no `brief`. `npx backlog` resolves to an unrelated package — we ship `pilotbook` and `pb` as the same package name/bin pair to avoid that.

## AIPIM

The closest competitor. Event-sourced (`events.jsonl` + SQLite), MCP, Svelte UI, write-time cycle rejection, Claude Code hooks, verification gate. Decisions are a write-only `log_decision` archive. Markdown is derived, not the source of truth.

Pilotbook takes the opposite storage bet (files only) and the missing product bet (rules + ADRs as edges, `pb brief`). The verification gate is adapted: a content hash in frontmatter instead of an event log, so evidence shows up in the pull request.

## Spec Kit / OpenSpec / BMAD / Taskmaster

Strong at greenfield spec rituals, delta specs, or PRD-to-task decomposition. None of them lint a typed knowledge graph or compile a token-budgeted brief from linked rules.

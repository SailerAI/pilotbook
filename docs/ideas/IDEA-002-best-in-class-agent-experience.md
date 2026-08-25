---
id: IDEA-002
title: Best-in-class agent experience
type: idea
status: promoted
impact: high
effort: high
promoted_to: [EPIC-009]
related: [EPIC-007, US-032, US-033, US-034, US-035, BR-003]
tags: [agents, skills, discover]
created: 2026-08-25
updated: 2026-08-25
---
## Why

Builders point Cursor or Claude Code at a repo and expect the agent to behave like a senior teammate: interview the demand, search the market, search this graph, search this code, then shape work that already exists in git. Today Pilotbook's engine (`pb brief`, `pb clarify`, `pb analyze`, MCP) is ahead of the prompt layer. The six shipped skills are 17–36 line CLI checklists. Discover compresses all research into one line. Nothing calibrates to repo maturity. Architect never looks for an existing implementation. `skills/shape.md` and `skills/discover.md` tell the agent to run `pb similar`, which is not in `src/`, while US-034 is marked `done`. Spec Kit, BMAD, OpenSpec, and Taskmaster win the first session because their skills are protocols with interview, research, and handoff — not command lists. If Pilotbook stays a graph compiler with thin skills, builders will keep installing those harnesses on top of us.

## Jobs to be done

When I say "I want X" in Cursor or Claude Code, I want the agent to read this repo's maturity, ask only the questions that are still open, and leave a researched idea plus shippable stories, so I do not have to prompt the discovery ritual myself.

When I am in a greenfield repo, I want the agent to ask more and invent less from empty ADRs. When I am in a mature repo, I want it to reuse accepted ADRs and existing code instead of re-specifying the stack.

When I am shaping or architecting, I want the agent to search the web, this graph, and this codebase in parallel and cite what it found, so stories do not clone live work and tasks do not reimplement what already ships.

## Personas

- **Builder / founder** using Cursor or Claude Code as the primary IDE, who wants a teammate not a ticket clerk.
- **Coding agent** that must load one skill at a time, obey BR-/ADR- files, and never invent IDs.

## Sketch

Calibrate first: `pb profile` returns a derived maturity level (greenfield / shaping / operating / mature) plus calibration hints from graph counts, accepted ADRs, active BRs, `checks.commands`, `codeMap`, test framework, and git age. Skills read that payload; maturity is never stored in frontmatter.

Rewrite the six `skills/*.md` from checklists into protocols: question budget and stop conditions, research fan-out (web + `pb similar` + code grounding), a handoff naming the next skill, and a `Do not` section. Collapse `CURSOR_RULE`, `AGENTS_SNIPPET`, and `.cursor/rules/pilotbook.mdc` into one router that `pb instructions overview` surfaces so Cursor and Claude Code route identically.

Engine primitives the skills need to be honest: implement `pb similar` (US-034 is falsely `done`); a code-grounding op over `codeMap`; `## Prior art` and `## Evidence` on the idea template with a clarify gap and a lint warning for a promoted idea with zero evidence; `pnpm sync:skills` plus a drift test and an opt-in overwrite so upgrades actually reach existing installs.

Optional CLI fallback: `pb generate <skill>` runs the same skill markdown with an exported `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` for builders not inside Cursor/Claude. Graph commands never call an LLM. Coding agents remain the primary interface.

BR-003 stays binding: every added skill line must change what the agent does next.

## Prior art

- **Spec Kit** (GitHub) — `specify init` installs skills (`speckit-specify`, `speckit-plan`, `speckit-tasks`, `speckit-implement`, `speckit-converge`) across 38 agent integrations, with an upgrade path. Process is Spec → Plan → Tasks → Implement. No typed knowledge graph, no authority-ordered brief. https://github.com/github/spec-kit/
- **BMAD Method** — 12+ persona agents (Analyst, PM, Architect, QA) with YAML-defined handoff protocols. Heavy ceremony; wins greenfield inception; weak as a lint-gated graph. https://reenbit.com/bmad-vs-spec-kit-vs-openspec-choosing-your-spec-driven-ai-framework/
- **OpenSpec** (Fission AI) — brownfield-first delta specs (`ADDED` / `MODIFIED` / `REMOVED`) and `/opsx:explore` against the existing codebase. Change folders, not a work graph with BR/ADR edges. https://github.com/Fission-AI/OpenSpec
- **Taskmaster AI** — PRD → dependency-aware task graph, Cursor-first MCP. Decomposition engine, not discovery or compiled briefs. https://medium.com/spillwave-solutions/agentic-coding-gsd-vs-spec-kit-vs-openspec-vs-taskmaster-ai-where-sdd-tools-diverge-0414dcb97e46
- **AIPIM** — closest storage competitor (event log + SQLite, MCP `get_project_context`, `log_decision`). Markdown is derived. No compiled brief from linked rules. https://github.com/rmarsigli/aipim
- **Backlog.md** — markdown kanban + MCP + `backlog instructions overview`. Tasks are files; no typed BR edges, no `brief`. https://github.com/mrlesk/backlog.md
- **Kiro** (AWS) — IDE-native spec loop (requirements → design → tasks). Host, not a repo-native graph. https://kiro.dev/docs/mcp/

What we would do differently: keep markdown as the only SOT (ADR-0001), compile `pb brief` from typed edges, and make skills honest protocols that call real ops (`profile`, `similar`, code grounding) instead of ceremony folders or persona theater.

## Evidence

- 2026-08-25 — Spec Kit 1.0 ships skills mode and 38 integrations; upgrade is a first-class CLI: https://github.com/github/spec-kit/
- 2026-08-25 — OpenSpec existing-projects guide: do not document the whole codebase; write deltas for the slice you change: https://openspec.dev/docs/existing-projects
- 2026-08-25 — Backlog.md `init` writes a short instruction file pointing agents at `backlog instructions overview` (same progressive-disclosure bet as US-014): https://github.com/mrlesk/backlog.md
- 2026-08-25 — AIPIM MCP `get_project_context` returns name, stats, blockers, recent decisions — the closest analog to `pb profile`: https://github.com/rmarsigli/aipim
- EPIC-007 / US-032 / US-035 — discover→shape already exists as a thin checklist; US-032's protocol names `pb similar` which is not in `src/`.
- US-034 — `status: done` with `pb similar` unimplemented (`src/ops/query.ts` `searchGraph` has no `--type`; no `similar` function).
- US-033 — idea template was supposed to have JTBD, Personas, Evidence; `templates/idea.md` still has only Why / Sketch / Open questions / Why not now.
- BR-003 — a brief line must change agent behaviour (draft; still the skill-authoring rule).
- `src/ops/init.ts` `write()` skips existing files; skill upgrades never reach users.
- `.cursor/skills/architect/SKILL.md` is stale vs `skills/architect.md` (`pb split` missing).

## Open questions

- Should `pb profile` call git (commit count, age) or stay a pure function of markdown + config so ADR-0001 stays obvious?
- Is code grounding a new command (`pb ground`) or a mode of `pb similar` / `pb search`?
- Do we overwrite user-edited skills on upgrade, or only files whose hash still matches the previous shipped body?

## Why not now

Eval harness and a competitor-benchmark work-item type stay deferred (US-028 already owns "prove the brief changes behaviour"). Webhooks and a second graph stay out. This is ready to promote: the gap is the prompt layer plus a few missing primitives, not a new product.

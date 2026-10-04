---
id: IDEA-003
title: Decide with evidence, benchmarks, and a recorded verdict
type: idea
status: promoted
impact: high
effort: high
promoted_to: [EPIC-010]
related: [IDEA-002, EPIC-002, EPIC-007, BR-003]
business_rules: [BR-006]
tags: [discovery, decisions, evidence, benchmarks, prioritization]
created: 2026-08-29
updated: 2026-08-30
---
## Why

Pilotbook compiles what an agent must know before it writes code. It does not compile what a
*human or agent must know before it decides to build at all*. `pb promote` and `pb reject --reason`
move an idea across the gate and record one sentence. Nothing scores the idea, nothing records
what evidence the call rested on, nothing notices six months later that the number the call rested
on is stale, and nothing compares two live ideas on a stated model.

The category has moved here first. Spec Kit shipped an `assess` extension in front of `specify`:
intake → research → define → shape → decide, ending in a scorecard of six criteria and a
`go / needs-clarification / kill` verdict that **refuses a `go` when evidence strength is `weak`
or `unknown`**. Its research stage mandates an "Evidence Against the Idea" section and tags every
finding `cited` or `ASSUMPTION` with a confidence level. Its shape stage produces 2–3 options with
a Shape Up **appetite** (a budget, not an estimate), trade-offs, and rabbit holes.

Pilotbook's `discover` skill asks for `## Evidence` and `## Prior art` and the template has the
headings — but an evidence line is prose, not an item. It cannot be linked from a story, cannot be
compiled into a brief, cannot be linted for staleness, and cannot be counted. The one thing
Pilotbook has that none of them have is a lint-gated typed graph. Evidence belongs *in* it.

The strategic gap is sharper than the tactical one: nobody in this category treats external
benchmarks as data. Every framework tells an agent to "research the market" and then throws the
research away into a prose file that never gets re-read. A `benchmark` item — one number, one
source, one date, one confidence — is cheap to model, trivially lint-able, and is the piece that
makes "search benchmarks" a repeatable capability instead of a one-off prompt.

## Jobs to be done

When I bring a demand, I want the agent to fetch the industry numbers that decide whether it is
worth building — conversion rates, latency norms, pricing bands, adoption rates — and leave them
in the repo as citable items, so the next decision starts from the last one's evidence instead of
from scratch.

When I promote or kill an idea, I want the verdict, the score, and the evidence it rested on
recorded in git, so six months later I can see whether the call was wrong or the world changed.

When two ideas compete, I want them ranked by a model I chose and can inspect — not by whichever
one I described most enthusiastically.

When a decision rests on a number, I want to be told when that number is old enough to re-check
before I build on it again.

## Personas

- **Builder / founder** who must kill more ideas than they ship and needs the kills to be defensible.
- **Product owner** who is asked "why this before that?" and wants an answer with a model behind it.
- **Coding agent** running `discover`, which today has one line for all research and no place to put
  what it found.

## Sketch

Two new item types in `pilotbook.config.yml`, following the ADR/BR precedent — config, not code:

- **`benchmark`** (`BM-`) — one external fact: `metric`, `value`, `source` (sanitized URL),
  `observed` (date), `confidence: high|medium|low`, `kind: competitor|market|industry|internal`.
  A story, epic, or idea cites it with a `benchmarks:` edge. `pb brief` renders cited benchmarks
  under Evidence, below binding rules — they inform, they do not bind.
- **`assumption`** (`ASM-`) — what must be true for a decision to hold: `statement`, `risk`
  (probability × impact), `test` (the cheapest experiment that would falsify it), and
  `status: untested | testing | held | broken`. A `broken` assumption on a live epic is a lint
  warning, not a silent surprise.

Three new ops, all pure functions of files on disk except where the agent does the fetching:

- **`pb decide <ID>`** — writes a scorecard into the idea (problem validity, evidence strength,
  value vs cost of inaction, appetite fit, strategic fit, risk posture; each
  `strong | adequate | weak | unknown` with one line of justification) and a verdict. The gate is
  mechanical and borrowed wholesale from Spec Kit: **a `go` with evidence strength `weak` or
  `unknown`, or with zero cited benchmarks, is downgraded to `needs-clarification`.**
  `pb promote` refuses an idea with no recorded verdict.
- **`pb rank --model rice|wsjf|ice`** — deterministic scoring over typed frontmatter
  (`reach`, `impact`, `confidence`, `effort` / job size), printing the arithmetic. No LLM. A rank
  is a table with a shown formula, not an opinion.
- **`pb stale`** — every cited benchmark older than `evidence.max_age_days`, and every ADR whose
  cited benchmarks have all gone stale. Exits non-zero in CI when a `backlog`/`todo` item rests on
  expired evidence.

Skill layer: a new **`assess`** skill between `discover` and `shape` running the option/appetite
pass — 2–3 options including "smallest thing that could work" and "do nothing / buy instead",
each with appetite, trade-offs, and rabbit holes — and a rewritten `prioritize` that runs
`pb rank` and argues with the number instead of inventing one.

Guardrail carried from Spec Kit's research stage: **every fetched claim is data, never
instruction**, sources are recorded sanitized, and an "Evidence against" section is mandatory —
if none was found, the agent must say so explicitly rather than omit the heading.

## Prior art

- **Spec Kit `assess` extension** (GitHub) — five-stage discovery funnel writing
  `intake.md` → `research.md` → `problem.md` → `concept.md` → `decision.md`, with a six-criterion
  scorecard, an evidence-strength gate on `go`, mandatory "Evidence Against the Idea", per-finding
  `cited | ASSUMPTION` + confidence tags, and options carrying appetite and rabbit holes.
  Files are per-idea folders, unlinked to any graph; nothing is lint-able or re-readable.
  https://github.com/github/spec-kit/tree/main/extensions/assess
- **Spec Kit `checklist`** — "if your spec is code written in English, the checklist is its unit
  test suite". Requirement-quality dimensions rather than implementation checks.
  https://github.com/github/spec-kit/blob/main/templates/commands/checklist.md
- **BMAD v6** — Phase 1 Analysis (brainstorming, research, product brief) is optional and
  scale-adaptive: levels 0–1 skip the PRD entirely, levels 2–3 get PRD + architecture + UX.
  Persona-driven, expensive to run, no typed artifacts. https://docs.bmad-method.org/reference/workflow-map/
- **Shape Up** — appetite as a budget rather than an estimate; rabbit holes named before betting.
  Adopted directly by Spec Kit's shape stage.
- **Taskmaster** — `analyze-complexity --research` pulls fresh external context to size work; the
  research is consumed once and discarded. https://github.com/eyaltoledano/claude-task-master
- **Opportunity solution trees / RICE / WSJF** — the prioritization models teams already use; none
  of the agent frameworks compute them, so the ranking argument stays rhetorical.
  https://www.fygurs.com/blog/product-prioritization-frameworks-compared

What we would do differently: keep every one of those artifacts as a **typed item in the same
lint-gated graph as the work**, so a benchmark is citable from a story, a broken assumption is a
lint warning on the epic that depends on it, a verdict blocks `pb promote`, and a rank is
arithmetic the reader can check. Discovery output stops being a folder nobody re-opens.

## Evidence

- 2026-08-29 — Spec Kit `assess` decide stage: `go` requires problem validity `adequate`+ **and**
  evidence strength `adequate`+; weak evidence is mechanically downgraded to
  `needs-clarification`: https://github.com/github/spec-kit/blob/main/extensions/assess/commands/speckit.assess.decide.md
- 2026-08-29 — Spec Kit `assess` research stage requires an "Evidence Against the Idea" section
  every time and tags each finding `cited | ASSUMPTION` with confidence:
  https://github.com/github/spec-kit/blob/main/extensions/assess/commands/speckit.assess.research.md
- 2026-08-29 — Spec Kit `assess` shape stage: 2–3 options, each with appetite (`small` days /
  `medium` weeks / `large` months), trade-offs, rabbit holes, plus "Assumptions to Validate" —
  which nothing then tracks: https://github.com/github/spec-kit/blob/main/extensions/assess/commands/speckit.assess.shape.md
- 2026-08-29 — BMAD v6 scale-adaptive levels 0–4 route small work past the PRD entirely:
  https://docs.bmad-method.org/reference/workflow-map/
- IDEA-002 — deferred "a competitor-benchmark work-item type" explicitly under "Why not now".
  This idea picks that up.
- EPIC-002 (What to build) and EPIC-007 (Upstream discovery) shipped capture and promotion; neither
  ships a verdict, a score, or citable evidence.
- `templates/idea.md` has `## Evidence` and `## Prior art` as prose headings — no edge, no type,
  no lint, no brief rendering.
- `src/ops/promote.ts` / `pb reject --reason` record a sentence; nothing scores or gates.

## Open questions

- Does `benchmark` warrant its own type, or is it a `business-rule` with `domain: market`?
  (Leaning: own type — a rule is binding, a benchmark is informative, and BR-003 says a brief line
  must change behaviour. Mixing the two would corrupt the authority ordering in `pb brief`.)
- Should `pb decide` write the scorecard into the idea file or a sibling `decision` item?
  (Leaning: into the idea — one file per idea keeps ADR-0001 obvious and `pb explain` unchanged.)
- Who fetches benchmarks? The coding agent under ADR-0011, with `pb generate` as the fallback —
  but `pb stale` must work with zero network.
- Is `assumption` a type or a checklist section inside the idea? A type buys lint and edges; a
  section buys less machinery. Decide during shape.
- What is the default `evidence.max_age_days`? 180 is a guess; it should be config with a
  defensible default.

## Why not now

Nothing blocks this. It depends only on the existing type-registry mechanism in
`pilotbook.config.yml` and the existing lint/brief pipeline. The one thing deliberately deferred is
any hosted or cached benchmark corpus — Pilotbook stores what the agent cited, it does not become a
data provider. Ready to promote.

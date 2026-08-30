---
id: IDEA-005
title: Ship without getting lost
type: idea
status: promoted
impact: high
effort: high
promoted_to: [EPIC-012]
related: [IDEA-003, IDEA-004, US-012, US-022, US-026, BR-002, BR-003, ADR-0003, ADR-0006]
business_rules: [BR-006]
tags: [execution, quality, standards, consistency, defects, agents]
created: 2026-08-29
updated: 2026-08-30
---
## Why

Pilotbook's ship loop is `next → brief → implement → verify → lint`. It is good at telling an agent
*what is binding*. It is silent on the four things that actually burn a session:

1. **The agent does not know how this repo writes code.** ADRs record decisions that were
   discussed; they do not record the thousand conventions that were never discussed — error
   handling shape, test layout, naming, the fact that ops are pure and transports are thin
   (ADR-0002 covers the principle, not the pattern). So the agent invents a house style, review
   sends it back, and the loop runs twice. Agent OS built its whole product on this: **Discover
   Standards** reverse-engineers conventions out of an existing codebase into documented standards,
   then injects only the relevant ones into context. Kiro calls the same thing steering files.
   Pilotbook has no equivalent.
2. **Ambiguous criteria are found by the agent, at implementation time.** A criterion that says
   "the board loads fast" or "the error is displayed prominently" cannot fail, so it passes, and the
   disagreement surfaces at review. Spec Kit's `checklist` names this exactly: *"if your spec is
   code written in English, the checklist is its unit test suite"* — and it checks whether
   `prominent` is quantified, not whether the button works. Pilotbook's `pb lint` checks
   referential integrity and never reads a criterion's *words*.
3. **Nothing checks that the artifacts agree with each other.** Spec Kit runs `/analyze` between
   tasks and implement for cross-artifact consistency. Pilotbook's `pb analyze` measures coverage.
   A story whose criteria no task claims, a task that proves a criterion index that does not exist,
   two stories specifying contradictory behaviour, a task that quietly contradicts an accepted
   ADR — all pass lint today.
4. **Every session starts from zero.** The brief compiles what is *decided*; nothing compiles what
   was *tried*. An agent that spent forty minutes discovering that approach A deadlocks leaves that
   knowledge in a transcript, and the next session — or the next agent — pays for it again. This is
   the single largest source of "we got there eventually, twice."

And one structural gap: **a bug is not an item type**. A production defect today is either a task
with no story, an epic nobody wanted, or a fix with no record at all. Spec Kit shipped a `bug`
extension for exactly this — assess → fix → test, three files, with the hard rule that assess and
test never modify source and only fix does.

## Jobs to be done

When I drop an agent into an unfamiliar area of this repo, I want it to receive that area's actual
conventions — extracted from the code, not from my memory — so its first draft looks like the code
around it.

When I hand an agent a story, I want to have been told beforehand which of its criteria are
untestable words, so I fix the sentence instead of paying for a wrong implementation.

When I resume work three days later, or a second agent picks it up, I want what was already tried
and rejected to be in the brief, so nobody relitigates a dead end.

When something is broken in production, I want to triage, fix, and verify it against the criterion
and rule it violated, without inventing an epic and a story to hold a two-line fix.

## Personas

- **Coding agent** working a task in an area it has never touched.
- **Builder** resuming a half-finished item after a weekend, or handing it to a teammate.
- **Reviewer** who keeps writing the same three comments on every PR.

## Sketch

Five moves, each small on its own and compounding through `pb brief`:

- **`standard`** (`STD-`) type, scoped by `code_map` area. `pb standards --discover` reads the
  files under an area and proposes convention statements with a cited example (`file:line`) and a
  counter-example where the repo is inconsistent. Proposals land as `status: draft` and a human or
  agent accepts them; Pilotbook never asserts a convention it cannot point at. `pb brief` compiles
  the standards for the task's `area` **below** ADRs and rules in the authority order — decisions
  bind, conventions guide.
- **Criterion quality lint.** A deterministic pass over `## Acceptance criteria`: unquantified
  comparatives (`fast`, `quickly`, `prominent`, `intuitive`, `simple`, `robust`), missing
  Given/When/Then structure (ADR-0003), criteria with no measurable object, and criteria that are
  two criteria wearing a trench coat. `pb lint --quality` warns with `file:line:col` like every
  other lint rule. No LLM — a word list and a shape check catch the majority, and BR-003's
  "must change agent behaviour" is the standard for what earns a rule.
- **`pb analyze --consistency`.** Story criteria no task claims; tasks binding a criterion index
  that no longer exists; a task whose scope contradicts an accepted ADR it links; sibling stories
  under one epic that specify conflicting behaviour on the same object; terminology drift (the same
  concept named three ways across an epic). Exits non-zero in CI.
- **`pb note <ID> --tried "…" --outcome rejected|partial|adopted`.** An append-only decision journal
  on the item — not a chat log, a list of paths taken and why they were abandoned. `pb brief`
  compiles it as "Already tried — do not repeat". Append-only, like `pb converge` (US-016), so a
  journal can never silently lose a dead end.
- **`defect`** (`BUG-`) type with a three-step protocol mirroring the bug extension: **assess**
  (locate, judge, propose — never edits source), **fix** (the only step that edits source, scope
  bounded by the assessment, deviations logged), **test** (re-run the reproduction — a repro that
  was not actually run is reported `not-run`, never `verified`). A defect links the criterion it
  violates and the BR or ADR it breaks, so `pb analyze` can report "this rule has been violated in
  production twice" — which is the signal that the rule, not the code, is wrong.

Sequencing note: US-012 (a small change may skip the epic and story) is the same instinct as BMAD's
scale-adaptive levels 0–4 and should ship with the defect type, not before it.

## Prior art

- **Agent OS** (Builder Methods) — Install → **Discover Standards** → Inject Standards → Shape
  Specs. Its pitch is precisely the re-teaching problem: *"every time you prompt an AI coding agent,
  you're re-teaching it context that should already be known."* Standards are markdown, tool
  agnostic, and injected selectively. No graph, no lint, no verification.
  https://buildermethods.com/agent-os
- **Kiro** (AWS) — steering files as persistent project guidance, plus agent hooks that fire on
  save/create/delete, plus EARS-notation requirements. Host-bound (an IDE), not repo-native.
  https://kiro.dev/blog/introducing-kiro/
- **Spec Kit `checklist`** — requirement-quality checks as "unit tests for English", organized by
  completeness, clarity, consistency, measurability, coverage, edge cases, NFRs, traceability;
  ≥80% of items must carry a traceability reference or an explicit gap marker.
  https://github.com/github/spec-kit/blob/main/templates/commands/checklist.md
- **Spec Kit `analyze`** — cross-artifact consistency between spec, plan, and tasks, run after
  `tasks` and before `implement`. https://github.com/github/spec-kit
- **Spec Kit `bug` extension** — `assess → fix → test`, per-bug directory, with the guardrail that
  only `fix` touches source and verification is never over-claimed.
  https://github.com/github/spec-kit/tree/main/extensions/bug
- **BMAD Test Architect (TEA)** — risk profile as probability × impact, test design from the risk
  profile, a traceability matrix that refreshes as tests accumulate, and a gate returning
  `PASS | CONCERNS | FAIL | WAIVED`. The waiver is the honest part: it records a knowingly accepted
  risk instead of a silent skip.
  https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/
- **OpenSpec** — brownfield-first delta specs (`ADDED` / `MODIFIED` / `REMOVED`) and an `explore`
  step that surfaces options before committing. Change folders, archived on completion; no typed
  graph. https://github.com/Fission-AI/OpenSpec

What we would do differently: every one of these is a **folder of markdown a command writes and
nothing re-reads**. Pilotbook already has the one mechanism that makes them compound — a typed,
lint-gated graph and a brief compiled from it in authority order. Standards, journals, defects and
consistency findings are worth ten times more as edges in that graph than as sibling files.

## Evidence

- 2026-08-29 — Agent OS's Discover Standards reverse-engineers conventions out of an existing
  codebase and injects only the relevant ones: https://buildermethods.com/agent-os
- 2026-08-29 — Spec Kit's checklist command explicitly rejects implementation checks ("verify the
  button clicks correctly") in favour of requirement-quality checks ("is 'prominent display'
  quantified with specific sizing?"):
  https://github.com/github/spec-kit/blob/main/templates/commands/checklist.md
- 2026-08-29 — Spec Kit's bug extension guardrail: assess and test never modify source; a
  reproduction that was not performed is reported `partial` or `not-run`, not `verified`:
  https://github.com/github/spec-kit/tree/main/extensions/bug
- 2026-08-29 — BMAD TEA's gate verdicts include `WAIVED`, recording accepted risk explicitly:
  https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/
- 2026-08-29 — Kiro steering files + event-driven agent hooks:
  https://kiro.dev/blog/introducing-kiro/
- `src/core/lint.ts` — rules are dangling refs, wrong type, cycles, unknown fields. Nothing reads a
  criterion's prose.
- `src/core/brief.ts` — compiles parent chain, business rules, ADRs. No conventions, no history of
  attempts.
- `pilotbook.config.yml` `types:` has no defect type; a production fix has nowhere to live
  (ADR-0004 allows a parentless task, which is the current workaround).
- US-022 (Prime a session with the in-progress brief) primes from the brief, which contains no
  record of what was tried.
- US-026 (Detect code that no in-flight item claims) is the mirror image of the consistency check
  and should share its reporting surface.

## Open questions

- Should `pb standards --discover` ever write without human acceptance? (Leaning: no — a wrong
  standard is worse than no standard, and it would compile into every brief in that area.)
- Where does the criterion-quality word list live — code, or config so a team can extend it?
  (Config is friendlier; code keeps `pb lint` a pure function with no surprise inputs.)
- Is the journal a section in the item file or a sibling `.pb/journal/<ID>.md`? In-file keeps
  ADR-0001 clean and shows up in the PR diff; it also grows the file the brief must budget.
- Does `defect` need its own status ladder (`triaged / fixing / verifying / closed`) or does the
  existing one stretch?
- Does the consistency check need a semantic comparison (terminology drift, conflicting behaviour)
  that a pure function cannot do? If so, it splits: `pb analyze --consistency` stays deterministic,
  and the semantic half becomes a skill protocol, not an op.

## Why not now

Standards discovery, the criterion-quality lint, and the consistency check are independent and
shippable immediately. The journal should follow US-022 so priming and journaling share one surface.
The defect type should ship with US-012 so a small fix has both a place to live and permission to
skip the ceremony. Deferred on purpose: risk-scored test design and a formal quality gate with
waivers — EPIC-006 already owns proof, and a gate on top of unproven criteria would be theatre.
Ready to promote.

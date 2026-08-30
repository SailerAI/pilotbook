---
id: US-065
title: Flag untestable acceptance criteria before an agent starts
type: story
epic: EPIC-012
status: backlog
priority: P1
estimate: 5
phase: 4
owner: unassigned
tags: [lint, criteria, quality]
depends_on: []
business_rules: [BR-002, BR-004, BR-005]
adrs: [ADR-0003, ADR-0006]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder handing a story to an agent,
**I want to** be told which criteria are untestable words,
**So that** I fix the sentence for pennies instead of paying for the wrong implementation.

## Acceptance criteria

- [ ] Given a criterion containing an unquantified comparative (`fast`, `quickly`, `prominent`,
      `intuitive`, `simple`, `robust`, `seamless`), when I run `pb lint --quality`, then it warns
      with `file:line:col` and names the word.
- [ ] Given a criterion that does not follow the Given/When/Then shape ADR-0003 requires, when I run
      `pb lint --quality`, then it warns.
- [ ] Given a criterion joined by "and" that asserts two independent behaviours, when I run
      `pb lint --quality`, then it warns that the criterion should be split.
- [ ] Given `pb lint` without `--quality`, when it runs, then referential-integrity output is
      unchanged — quality warnings never turn an existing clean graph red by surprise.
- [ ] Given the same files, when I run `pb lint --quality` twice, then output is identical: a word
      list and a shape check, no LLM, no network.
- [ ] Given `quality.words` in `pilotbook.config.yml`, when a team extends the list, then their
      words are checked too.

- [ ] Given the capability, when the story closes, then it is reachable as an MCP tool, returns structured `--json` output, and is named by the skill that would run it (BR-005).

## Notes

Spec Kit's checklist command draws the line this story depends on: the check is whether "prominent"
is quantified, not whether the button works. A deterministic word-and-shape pass catches the
majority of the damage at zero inference cost; anything needing judgment belongs in a skill, not in
lint.

## Out of scope

Rewriting the criterion, semantic ambiguity detection, and any LLM in the lint path.

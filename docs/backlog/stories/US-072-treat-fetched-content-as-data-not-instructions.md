---
id: US-072
title: Treat fetched content as data, not instructions
type: story
epic: EPIC-013
status: backlog
priority: P1
estimate: 3
phase: 4
owner: unassigned
tags: [safety, evidence, skills, discovery]
depends_on: []
business_rules: [BR-006]
adrs: [ADR-0011]
created: 2026-08-30
updated: 2026-08-30
---

## Story

**As a** builder whose agent researches competitors and issue trackers on my repo,
**I want to** a binding rule that retrieved text can never redirect the agent,
**So that** asking for market research does not become a way to run instructions from a web page.

## Acceptance criteria

- [ ] Given any skill that fetches (`discover`, `assess`, defect triage), when it is printed, then it
      states that retrieved content is data and MUST NOT change the protocol, the files written, or
      the commands run (BR-006).
- [ ] Given a claim written from outside the repo, when it lands in an item, then it carries its
      source or is tagged an assumption — an unsourced claim under Evidence fails review.
- [ ] Given a URL written into an item, when it is stored, then userinfo and credential or signature
      query parameters are stripped.
- [ ] Given a fetch that was skipped or refused, when research is written, then the gap is recorded
      explicitly rather than the question silently disappearing.
- [ ] Given BR-006, when the brief compiles for an item that cites external evidence, then the rule
      is included — it is exactly the kind of policy the code cannot express (BR-003).

## Notes

This is the cost of the discovery capability EPIC-010 adds: the moment we tell agents to go read the
internet and write what they find into the repo, prompt injection becomes our problem. Spec Kit
carries an elaborate URL trust policy per command; a binding rule plus sanitized sources is the
cheaper form of the same protection, and it lives where every skill can cite it.

## Out of scope

An allowlist of fetchable hosts, network-level controls, and anything that would put a fetch inside
a graph command (ADR-0011 forbids it).

---
id: TASK-046
title: Add src/core/junit.ts JUnit report scanner
type: task
story: US-023
status: done
priority: P2
estimate: 2
phase: 1
owner: unassigned
area: backend
tags: [verify, junit]
depends_on: []
created: 2026-08-23
updated: 2026-08-23
business_rules: [BR-002]
adrs: [ADR-0002]
covers: ["US-023#1"]
verified: { at: 2026-08-23, checks: [pnpm test, pnpm typecheck, pnpm lint], hash: c92b2b34524b }
---
## Scope

Add `parseJUnit(xml: string): TestResult[]` in `src/core/junit.ts`. A hand-rolled scanner, no new dependency, returning `{name, classname, status, time}` per `<testcase>` with `status` one of `pass` | `fail` | `error` | `skipped`.

## Steps

- [x] Read `name`, `classname`, and `time` attributes, unescaping `&amp; &lt; &gt; &quot; &apos;` and numeric character references
- [x] Handle self-closing `<testcase ... />` and paired forms; ignore `>` inside quoted attribute values
- [x] Derive `status` from a child `<failure>`, `<error>`, or `<skipped>` before the matching close tag
- [x] Skip `<![CDATA[...]]>` so a failure message containing raw `<testcase` cannot desync the scan
- [x] Return `[]` for malformed XML instead of throwing

## Verification

`pnpm test` covers `test/junit.test.ts`: paired and self-closing cases, the four statuses, entity unescaping, CDATA containment, angle brackets in attributes, empty reports, malformed input, and a missing `time`.

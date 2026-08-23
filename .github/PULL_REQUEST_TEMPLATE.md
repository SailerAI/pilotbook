## Summary

<!--
  1–3 bullets: what changed and why.
  Link the backlog item (TASK-NNN / US-NNN) and any ADR or business rule this implements.
-->

-

## Test plan

<!-- How a reviewer can verify this. Check off what you ran or exercised. -->

- [ ]

## Checklist

- [ ] Backlog item status is `review` or `done`; `BOARD.md` regenerated if docs changed
- [ ] Money stays a string in JSON and `NUMERIC` in Postgres (no floats, no raw Drizzle rows on the wire)
- [ ] UI changes verified in the browser (and mobile if layout changed)

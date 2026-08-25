---
name: discover
description: Research a raw idea into a filled idea doc with evidence links.
commands: [pb new, pb clarify, pb promote, pb reject, pb lint]
writes: [docs/ideas/*.md]
done: The idea file has Why, Sketch, Open questions, Why not now, and at least one evidence link. Promotion and rejection go through pb promote / pb reject.
---

# discover

1. `pb new idea --title "..."` if the file does not exist.
2. Search the web, similar products, and this repo for prior art.
3. Fill `## Why`, `## Sketch`, `## Open questions`, `## Why not now`.
4. Cite URLs and internal IDs (`ADR-`, `BR-`, `US-`).
5. Run `pb clarify <ID>` and answer the bounded question set (`pb clarify <ID> --answers '...'`) so gaps land as criteria, a business-rule, or an open question.
6. When impact, effort, and Why are clear (or `status: exploring`), promote with `pb promote <ID> --to epic --title "..."` (or `--to story --epic EPIC-NNN`). Do not hand-edit `promoted_to`.
7. If it should not be built, `pb reject <ID> --reason "..."` so the kill is recorded as `## Verdict`.

---
name: discover
description: Research a raw idea into a filled idea doc with evidence links.
commands: [pb new, pb lint]
writes: [docs/ideas/*.md]
done: The idea file has Why, Sketch, Open questions, Why not now, and at least one evidence link.
---

# discover

1. `pb new idea --title "..."` if the file does not exist.
2. Search the web, similar products, and this repo for prior art.
3. Fill `## Why`, `## Sketch`, `## Open questions`, `## Why not now`.
4. Cite URLs and internal IDs (`ADR-`, `BR-`, `US-`).
5. Do not promote to an epic unless impact/effort and a sponsor are clear.

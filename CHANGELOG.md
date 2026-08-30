# pilotbook

## 0.2.1

### Patch Changes

- b064e96: Rewrite the README and ship first-class user docs (guide + VitePress site) so npm and GitHub visitors can start in minutes.

## 0.2.0

### Minor Changes

- 5cf0104: Add `pb instructions` and `pb skill` so agents load one shipped workflow at a time instead of inlining every skill into AGENTS.md.

### Patch Changes

- 57b7d54: Copy shipped skills into `.cursor/skills/<name>/SKILL.md` during `pb init`, in addition to the Cursor rule and Claude skills.
- 245fc09: Reload the local UI when markdown on disk changes, instead of keeping a graph snapshot from process start.

## 0.1.0

### Minor Changes

- c25ed99: Initial public release of Pilotbook: markdown knowledge graph, `pb brief`, lint with file:line:col diagnostics, verification gate, skills, MCP, and loopback UI.

### Patch Changes

- dbb9c9e: Make the default Cursor rule from `pb init` always-apply so it binds when editing application source, not only markdown under `docs/`.
- ffa0dd9: Copy all five shipped skills (implement, groom, prioritize, architect, discover) during `pb init`.

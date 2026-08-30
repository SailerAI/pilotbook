---
"pilotbook": minor
---

Ship EPIC-013 "One loop, every agent host": every CLI command now has a matching MCP tool and a
skill that names it (`pb get`/`list`/`update`/`delete`/`schema`, 6 new MCP tools, a new `interop`
skill), `pb init --host <id>` installs into Cursor, Claude Code, or any AGENTS.md-reading host
(Codex included) with per-host status reporting, `.cursor/commands/` and `.claude/commands/` are
generated from the shipped skills, and fetched content is bound by a stated data-not-instructions
rule with a `sanitizeSourceUrl` helper. BR-005 and BR-006 move from draft to active.

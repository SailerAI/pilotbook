# Agents

This is the Pilotbook source tree. Use the local binary, not a published install:

```bash
pnpm pb next
pnpm pb brief TASK-NNN
pnpm pb lint
```

`pnpm lint` is Biome. `pnpm pb lint` is the work-item graph.

Follow the in-repo skills rather than copies:

- [skills/implement.md](skills/implement.md)
- [skills/architect.md](skills/architect.md)
- [skills/groom.md](skills/groom.md)
- [skills/prioritize.md](skills/prioritize.md)
- [skills/discover.md](skills/discover.md)

Treat linked business rules and accepted ADRs as binding. Create items with `pnpm pb new <type> --title "..."`. Never invent IDs.

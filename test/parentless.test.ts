import { describe, expect, it } from "vitest";
import { builtinTypes, extraKeys } from "../src/core/defaults.ts";
import { parseFrontmatter, serializeItem } from "../src/core/frontmatter.ts";
import { createItem, writeBoard } from "../src/ops/items.ts";
import { briefOf, lint, nextReady } from "../src/ops/query.ts";
import { adr, epic, makeProject, story, task } from "./helpers.ts";

describe("parentless tasks", () => {
  it("creates a task without a story and omits the key", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
    });
    const created = createItem(ctx, {
      type: "task",
      title: "Fix typo in README",
      area: "docs",
    });
    expect(created.data.story).toBeUndefined();
    const abs = created.rel.startsWith("/") ? created.rel : `/project/${created.rel}`;
    const text = ctx.fs.readFile(abs);
    expect(text).not.toMatch(/^story:/m);
    expect(text).not.toContain("US-000");
    expect(lint(ctx).errors).toEqual([]);
  });

  it("round-trips a parentless task without writing story", () => {
    const text = task("TASK-001", "", { title: "Tiny", area: "docs", estimate: 1, priority: "P2" });
    expect(text).not.toMatch(/^story:/m);
    const parsed = parseFrontmatter(text, "x.md");
    const cfg = builtinTypes().task!;
    const out = serializeItem(parsed.data, parsed.body, cfg.required, extraKeys(cfg));
    expect(out).not.toMatch(/^story:/m);
    expect(parseFrontmatter(out, "x.md").data).toEqual(parsed.data);
  });

  it("warns when parentless and estimate is high or P0", () => {
    const ctx = makeProject({
      "docs/backlog/tasks/TASK-001-big.md": task("TASK-001", "", {
        title: "Big",
        estimate: 5,
        priority: "P2",
      }),
    });
    const r = lint(ctx);
    expect(r.errors).toEqual([]);
    expect(r.warnings.some((w) => w.code === "parentless-task")).toBe(true);
  });

  it("does not warn for a small parentless task", () => {
    const ctx = makeProject({
      "docs/backlog/tasks/TASK-001-tiny.md": task("TASK-001", "", {
        title: "Tiny",
        estimate: 1,
        priority: "P2",
        area: "docs",
      }),
    });
    expect(lint(ctx).warnings.some((w) => w.code === "parentless-task")).toBe(false);
  });

  it("allows business_rules and adrs on a parented task", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
      "docs/adr/ADR-0001-a.md": adr("ADR-0001"),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", {
        adrs: ["ADR-0001"],
        business_rules: [],
      }),
    });
    expect(lint(ctx).errors.some((e) => e.code === "unknown-field")).toBe(false);
  });

  it("includes parentless tasks in brief and next", () => {
    const ctx = makeProject({
      "docs/backlog/tasks/TASK-001-tiny.md": task("TASK-001", "", {
        title: "Tiny fix",
        status: "todo",
        estimate: 1,
        area: "docs",
      }),
    });
    const { text } = briefOf(ctx, "TASK-001");
    expect(text).toContain("TASK-001");
    expect(nextReady(ctx).some((i) => i.id === "TASK-001")).toBe(true);
  });

  it("puts parentless tasks in Ungrouped and omits the bucket when empty", () => {
    const withOrphan = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001"),
      "docs/backlog/tasks/TASK-002-o.md": task("TASK-002", "", { title: "Orphan", area: "docs" }),
    });
    const rel = writeBoard(withOrphan);
    const md = withOrphan.fs.readFile(`/project/${rel}`);
    expect(md).toMatch(/### Ungrouped/);
    expect(md).toContain("TASK-002");
    expect(md).not.toContain("US-000");

    const none = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001"),
    });
    const rel2 = writeBoard(none);
    const md2 = none.fs.readFile(`/project/${rel2}`);
    expect(md2).not.toMatch(/Ungrouped/);
  });
});

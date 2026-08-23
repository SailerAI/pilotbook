import { describe, expect, it } from "vitest";
import { hostJoin, toPosix } from "../src/core/config.ts";
import { complete } from "../src/ops/complete.ts";
import { type OpContext, PilotbookError } from "../src/ops/context.ts";
import { convergeItem } from "../src/ops/converge.ts";
import { adr, epic, makeProject, rule, story, task } from "./helpers.ts";

function fixture(
  extra: Record<string, string> = {},
  storyExtra: Record<string, unknown> = {},
  storyBody?: string,
): OpContext {
  return makeProject({
    "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
    "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", storyExtra, storyBody),
    ...extra,
  });
}

function dumpFiles(ctx: OpContext): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (abs: string) => {
    const st = ctx.fs.stat(abs);
    if (st?.isFile) {
      out[toPosix(abs)] = ctx.fs.readFile(abs);
      return;
    }
    if (!ctx.fs.exists(abs)) return;
    for (const name of ctx.fs.readdir(abs)) walk(hostJoin(abs, name));
  };
  walk(ctx.project.projectRoot);
  return out;
}

describe("convergeItem", () => {
  it("dry-run reports a plan of tasks and writes nothing", () => {
    const ctx = fixture(
      {},
      { business_rules: ["BR-001"], adrs: ["ADR-0001"] },
      "## Story\n\nAs a user.\n\n## Acceptance criteria\n\n- [ ] first gap\n- [ ] second gap\n",
    );
    ctx.fs.writeFile(
      hostJoin(ctx.project.projectRoot, "docs/business-rules/BR-001-r.md"),
      rule("BR-001"),
    );
    ctx.fs.writeFile(hostJoin(ctx.project.projectRoot, "docs/adr/ADR-0001-a.md"), adr("ADR-0001"));
    const before = dumpFiles(ctx);
    const result = convergeItem(ctx, "US-001", { dryRun: true });
    expect(result.status).toBe("plan");
    expect(result.dryRun).toBe(true);
    expect(result.created).toEqual([]);
    expect(result.tasks).toEqual([
      expect.objectContaining({
        type: "task",
        title: "first gap",
        story: "US-001",
        covers: ["US-001#1"],
        business_rules: ["BR-001"],
        adrs: ["ADR-0001"],
      }),
      expect.objectContaining({
        title: "second gap",
        covers: ["US-001#2"],
      }),
    ]);
    expect(dumpFiles(ctx)).toEqual(before);
  });

  it("dry-run reports converged when every criterion already has a covering task", () => {
    const ctx = fixture(
      {
        "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", { covers: ["US-001#1"] }),
      },
      {},
      "## Story\n\nAs a user.\n\n## Acceptance criteria\n\n- [ ] first\n",
    );
    const before = dumpFiles(ctx);
    const result = convergeItem(ctx, "US-001", { dryRun: true });
    expect(result).toMatchObject({ status: "converged", dryRun: true, tasks: [], created: [] });
    expect(dumpFiles(ctx)).toEqual(before);
  });

  it("writes only new task files linked to the parent story and inherited rules/adrs", () => {
    const ctx = fixture(
      {
        "docs/business-rules/BR-001-r.md": rule("BR-001"),
        "docs/adr/ADR-0001-a.md": adr("ADR-0001"),
      },
      { business_rules: ["BR-001"], adrs: ["ADR-0001"] },
      "## Story\n\nAs a user.\n\n## Acceptance criteria\n\n- [ ] close the gap\n",
    );
    const before = dumpFiles(ctx);
    const result = convergeItem(ctx, "US-001");
    expect(result.status).toBe("converged");
    expect(result.dryRun).toBe(false);
    expect(result.created).toHaveLength(1);
    const created = result.created[0]!;
    expect(created.type).toBe("task");
    expect(created.data.story).toBe("US-001");
    expect(created.data.covers).toEqual(["US-001#1"]);
    expect(created.data.business_rules).toEqual(["BR-001"]);
    expect(created.data.adrs).toEqual(["ADR-0001"]);
    expect(created.rel).toMatch(/^docs\/backlog\/tasks\/TASK-\d+-close-the-gap\.md$/);

    const after = dumpFiles(ctx);
    const added = Object.keys(after).filter((p) => !(p in before));
    expect(added.length).toBe(1);
    expect(added[0]).toContain("/backlog/tasks/");
    expect(added[0]).toMatch(/TASK-\d+-close-the-gap\.md$/);
    for (const [path, content] of Object.entries(before)) {
      expect(after[path]).toBe(content);
    }
    expect(ctx.fs.exists(hostJoin(ctx.project.projectRoot, "docs/backlog/BOARD.md"))).toBe(false);
  });

  it("does not create tasks for uncovered rules or ADRs", () => {
    const ctx = fixture(
      {
        "docs/business-rules/BR-001-r.md": rule("BR-001"),
        "docs/adr/ADR-0001-a.md": adr("ADR-0001"),
      },
      {},
      "## Story\n\nAs a user.\n\n## Acceptance criteria\n\n- [ ] only criterion\n",
    );
    const result = convergeItem(ctx, "US-001");
    expect(result.created).toHaveLength(1);
    expect(result.tasks.map((t) => t.covers)).toEqual([["US-001#1"]]);
  });

  it("scopes an epic to child stories", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story(
        "US-001",
        "EPIC-001",
        {},
        "## Story\n\nA.\n\n## Acceptance criteria\n\n- [ ] from one\n",
      ),
      "docs/backlog/stories/US-002-s.md": story(
        "US-002",
        "EPIC-001",
        {},
        "## Story\n\nB.\n\n## Acceptance criteria\n\n- [ ] from two\n",
      ),
    });
    const result = convergeItem(ctx, "EPIC-001", { dryRun: true });
    expect(result.tasks.map((t) => t.covers[0]).sort()).toEqual(["US-001#1", "US-002#1"]);
    expect(result.tasks.find((t) => t.story === "US-001")?.title).toBe("from one");
    expect(result.tasks.find((t) => t.story === "US-002")?.title).toBe("from two");
  });

  it("leaves files byte-identical on a second converge with no remaining gaps", () => {
    const ctx = fixture(
      {},
      {},
      "## Story\n\nAs a user.\n\n## Acceptance criteria\n\n- [ ] first\n- [ ] second\n",
    );
    const first = convergeItem(ctx, "US-001");
    expect(first.created).toHaveLength(2);
    const snapshot = dumpFiles(ctx);
    const second = convergeItem(ctx, "US-001");
    expect(second.status).toBe("converged");
    expect(second.created).toEqual([]);
    expect(dumpFiles(ctx)).toEqual(snapshot);
  });

  it("refuses when the planned task path already exists", () => {
    const ctx = fixture();
    ctx.fs.writeFile(
      hostJoin(ctx.project.projectRoot, "docs/backlog/tasks/TASK-001-works.md"),
      "not a valid item\n",
    );
    try {
      convergeItem(ctx, "US-001");
      expect.unreachable("expected unsafe-write");
    } catch (err) {
      expect(err).toBeInstanceOf(PilotbookError);
      expect((err as PilotbookError).code).toBe("unsafe-write");
    }
  });

  it("refuses types that are not a story or epic", () => {
    const ctx = fixture({
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001"),
    });
    expect(() => convergeItem(ctx, "TASK-001")).toThrow(/story or epic/);
  });
});

describe("complete converge", () => {
  it("offers the converge command", () => {
    const ctx = fixture();
    expect(complete(ctx, [""]).map((h) => h.value)).toContain("converge");
  });
});

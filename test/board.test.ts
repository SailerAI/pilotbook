import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hostJoin } from "../src/core/config.ts";
import { NodeFileSystem } from "../src/core/node-fs.ts";
import { boardPlan, writeBoard } from "../src/ops/items.ts";
import { DATES, epic, fm, makeProject, task } from "./helpers.ts";

function sample(extra: Record<string, string> = {}) {
  return makeProject({
    "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Ledger", status: "review" }),
    "docs/backlog/stories/US-001-s.md": fm(
      {
        id: "US-001",
        title: "Post tx",
        type: "story",
        epic: "EPIC-001",
        status: "in-progress",
        priority: "P1",
        estimate: 3,
        phase: 1,
        owner: "unassigned",
        tags: [],
        depends_on: [],
        business_rules: [],
        adrs: [],
        tracker: "jira-99",
        ...DATES,
      },
      "## Story\n\nAs a builder.\n\n<!-- keep-this-comment -->\n\n## Acceptance criteria\n\n- [ ] works\n",
    ),
    "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", {
      title: "Implement post",
      status: "todo",
    }),
    ...extra,
  });
}

describe("writeBoard lock-in", () => {
  it("reflects graph status and never writes item files", () => {
    const ctx = sample();
    const before = new Map(ctx.project.index.items.map((i) => [i.abs, ctx.fs.readFile(i.abs)]));
    const rel = writeBoard(ctx);
    const md = ctx.fs.readFile(hostJoin(ctx.project.projectRoot, rel));
    expect(md).toContain("### review (");
    expect(md).toContain("### in-progress (");
    expect(md).toContain("EPIC-001");
    expect(md).toContain("US-001");
    for (const [abs, content] of before) {
      expect(ctx.fs.readFile(abs)).toBe(content);
    }
    const storyAbs = [...before.keys()].find((abs) => abs.includes("US-001"));
    expect(storyAbs).toBeDefined();
    const storyText = ctx.fs.readFile(storyAbs!);
    expect(storyText).toContain("tracker: jira-99");
    expect(storyText).toContain("<!-- keep-this-comment -->");
    expect(storyText).toMatch(/^status: in-progress$/m);
  });

  it("leaves the previous board in place when atomic write throws", () => {
    const ctx = sample();
    const rel = writeBoard(ctx);
    const abs = hostJoin(ctx.project.projectRoot, rel);
    const previous = ctx.fs.readFile(abs);
    ctx.fs.writeFileAtomic = () => {
      throw new Error("disk full");
    };
    expect(() => writeBoard(ctx)).toThrow("disk full");
    expect(ctx.fs.readFile(abs)).toBe(previous);
  });
});

describe("boardPlan", () => {
  it("reports inSync when the existing board matches generated ids", () => {
    const ctx = sample();
    writeBoard(ctx);
    const plan = boardPlan(ctx);
    expect(plan.inSync).toBe(true);
    expect(plan.added).toEqual([]);
    expect(plan.orphans).toEqual([]);
  });

  it("reports added and orphans with last-known status and writes nothing", () => {
    const ctx = sample();
    const rel = `${ctx.project.config.root}/${ctx.project.config.board}`;
    const abs = hostJoin(ctx.project.projectRoot, rel);
    const stale = `# Backlog board

## By status

### done (1)

| ID | Title | Type | Pri |
| --- | --- | --- | --- |
| [TASK-099](backlog/tasks/TASK-099-gone.md) | Gone | task | P1 |

`;
    ctx.fs.mkdirp(hostJoin(abs, ".."));
    ctx.fs.writeFile(abs, stale);
    const plan = boardPlan(ctx);
    expect(ctx.fs.readFile(abs)).toBe(stale);
    expect(plan.inSync).toBe(false);
    expect(plan.orphans).toEqual([{ id: "TASK-099", status: "done" }]);
    expect(plan.added.map((a) => a.id).sort()).toEqual(["EPIC-001", "TASK-001", "US-001"]);
    expect(plan.added.find((a) => a.id === "TASK-001")).toEqual({
      id: "TASK-001",
      status: "todo",
    });
    expect(plan.added.find((a) => a.id === "US-001")).toEqual({
      id: "US-001",
      status: "in-progress",
    });
    expect(plan.added.find((a) => a.id === "EPIC-001")).toEqual({
      id: "EPIC-001",
      status: "review",
    });
  });
});

describe("NodeFileSystem.writeFileAtomic", () => {
  it("replaces the target via rename and leaves no temp sibling", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "pb-atomic-"));
    const fs = new NodeFileSystem(dir);
    const target = path.join(dir, "BOARD.md");
    writeFileSync(target, "old\n");
    fs.writeFileAtomic(target, "new\n");
    expect(readFileSync(target, "utf8")).toBe("new\n");
    expect(readdirSync(dir).filter((f) => f.includes(".tmp"))).toEqual([]);
  });
});

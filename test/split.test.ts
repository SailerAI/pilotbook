import { describe, expect, it } from "vitest";
import { dumpDefaultConfig } from "../src/core/config.ts";
import { PilotbookError } from "../src/ops/context.ts";
import { scoreComplexity, splitItem } from "../src/ops/split.ts";
import { epic, makeProject, story, task } from "./helpers.ts";

const FAT_BODY = `## Story

Do several things.

## Acceptance criteria

- [ ] First criterion about src/ops
- [ ] Second criterion
- [ ] Third criterion
`;

function mappedProject(files: Record<string, string>) {
  return makeProject({
    "pilotbook.config.yml": dumpDefaultConfig().replace(
      "code_map: {}",
      "code_map:\n  backend: [src]\n  frontend: [ui]\n",
    ),
    ...files,
  });
}

describe("split", () => {
  it("dry-run scores a story and writes nothing", () => {
    const ctx = mappedProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", { title: "Fat" }, FAT_BODY),
    });
    const before = ctx.fs.readFile("/project/docs/backlog/stories/US-001-s.md");
    const plan = splitItem(ctx, "US-001", { dryRun: true });
    expect(plan.dryRun).toBe(true);
    expect(plan.recommended_count).toBeGreaterThanOrEqual(2);
    expect(plan.children.length).toBe(plan.recommended_count);
    expect(ctx.fs.readFile("/project/docs/backlog/stories/US-001-s.md")).toBe(before);
    const item = ctx.project.index.byId.get("US-001")!;
    const score = scoreComplexity(item, ctx.project.config);
    expect(score.criterion_count).toBe(3);
  });

  it("refuses an already-small task", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
      "docs/backlog/tasks/TASK-001-t.md": task(
        "TASK-001",
        "US-001",
        { area: "backend" },
        "## Scope\n\n- [ ] One box\n",
      ),
    });
    expect(() => splitItem(ctx, "TASK-001", { dryRun: true })).toThrow(/already small/);
    try {
      splitItem(ctx, "TASK-001");
    } catch (err) {
      expect(err).toBeInstanceOf(PilotbookError);
      expect((err as PilotbookError).fix).toBeTruthy();
    }
  });

  it("apply creates tasks via pb new with area and depends_on", () => {
    const ctx = mappedProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", { title: "Fat" }, FAT_BODY),
    });
    const result = splitItem(ctx, "US-001");
    expect(result.dryRun).toBe(false);
    const tasks = result.created.filter((c) => c.type === "task");
    expect(tasks.length).toBe(result.recommended_count);
    expect(tasks.every((c) => c.id?.startsWith("TASK-"))).toBe(true);
    const first = ctx.project.index.byId.get(tasks[0]!.id!)!;
    expect(first.type).toBe("task");
    expect(first.data.story).toBe("US-001");
    expect(first.data.area).toBeTruthy();
    const second = ctx.project.index.byId.get(tasks[1]!.id!)!;
    expect(Array.isArray(second.data.depends_on) && second.data.depends_on.length).toBeGreaterThan(
      0,
    );
  });

  it("splits an epic into stories without area", () => {
    const ctx = mappedProject({
      "docs/backlog/epics/EPIC-001-e.md": epic(
        "EPIC-001",
        { title: "Big" },
        "## Outcome\n\n- [ ] A\n- [ ] B\n",
      ),
    });
    const result = splitItem(ctx, "EPIC-001");
    expect(result.created.every((c) => c.type === "story")).toBe(true);
    const child = ctx.project.index.byId.get(result.created[0]!.id!)!;
    expect(child.data.area).toBeUndefined();
    expect(child.data.epic).toBe("EPIC-001");
  });

  it("parentless split requires --epic and reparents the original", () => {
    const fatTask = `## Scope\n\n- [ ] One in src/ops\n- [ ] Two\n- [ ] Three\n`;
    const ctx = mappedProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/tasks/TASK-001-o.md": task("TASK-001", "", { title: "Fat orphan" }, fatTask),
    });
    expect(() => splitItem(ctx, "TASK-001")).toThrow(/--epic/);
    const result = splitItem(ctx, "TASK-001", { epic: "EPIC-001" });
    expect(result.storyId).toMatch(/^US-/);
    const original = ctx.project.index.byId.get("TASK-001")!;
    expect(original.data.story).toBe(result.storyId);
    expect(result.created.some((c) => c.type === "story")).toBe(true);
    expect(result.created.some((c) => c.type === "task" && c.id !== "TASK-001")).toBe(true);
  });
});

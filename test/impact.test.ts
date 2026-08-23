import { describe, expect, it } from "vitest";
import { PilotbookError } from "../src/ops/context.ts";
import { impactOf } from "../src/ops/impact.ts";
import { adr, epic, makeProject, rule, story, task } from "./helpers.ts";

describe("impact", () => {
  it("lists inbound stories and tasks and flags done", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/business-rules/BR-001-r.md": rule("BR-001"),
      "docs/adr/ADR-0001-a.md": adr("ADR-0001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", {
        business_rules: ["BR-001"],
        adrs: ["ADR-0001"],
        status: "done",
      }),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", {
        business_rules: ["BR-001"],
        status: "todo",
      }),
    });
    const before = [...ctx.project.index.items.map((i) => ctx.fs.readFile(i.abs))].join("\0");
    const report = impactOf(ctx, "BR-001");
    expect(report.version).toBe(1);
    expect(report.items.map((i) => i.id).sort()).toEqual(["TASK-001", "US-001"]);
    expect(report.items.find((i) => i.id === "US-001")?.done).toBe(true);
    expect(report.items.find((i) => i.id === "TASK-001")?.done).toBe(false);
    const after = [...ctx.project.index.items.map((i) => ctx.fs.readFile(i.abs))].join("\0");
    expect(after).toBe(before);
  });

  it("refuses a story id", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
    });
    expect(() => impactOf(ctx, "US-001")).toThrow(PilotbookError);
  });
});

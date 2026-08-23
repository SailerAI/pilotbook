import { describe, expect, it } from "vitest";
import { TEMPLATE_CRITERION } from "../src/core/checklist.ts";
import { analyzeGraph } from "../src/ops/analyze.ts";
import { complete } from "../src/ops/complete.ts";
import { lint } from "../src/ops/query.ts";
import { adr, epic, makeProject, rule, story, task } from "./helpers.ts";

function fixture(
  extra: Record<string, string> = {},
  storyExtra: Record<string, unknown> = {},
  storyBody?: string,
): ReturnType<typeof makeProject> {
  return makeProject({
    "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
    "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", storyExtra, storyBody),
    ...extra,
  });
}

describe("analyzeGraph", () => {
  it("reports uncovered active rules and accepted ADRs", () => {
    const ctx = fixture({
      "docs/business-rules/BR-001-r.md": rule("BR-001"),
      "docs/adr/ADR-0001-a.md": adr("ADR-0001"),
    });
    const report = analyzeGraph(ctx);
    expect(report.ok).toBe(false);
    expect(report.coveragePercent).toBe(0);
    expect(report.coverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "BR-001",
          hasTask: false,
          taskIds: [],
          notes: "no inbound story/task",
        }),
        expect.objectContaining({
          key: "ADR-0001",
          hasTask: false,
          taskIds: [],
          notes: "no inbound edge",
        }),
        expect.objectContaining({ key: "US-001#1", hasTask: false, notes: "no covering task" }),
      ]),
    );
  });

  it("treats inbound stories and tasks as covering a rule or ADR", () => {
    const ctx = fixture(
      {
        "docs/business-rules/BR-001-r.md": rule("BR-001"),
        "docs/adr/ADR-0001-a.md": adr("ADR-0001"),
        "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", {
          business_rules: ["BR-001"],
        }),
      },
      { business_rules: ["BR-001"], adrs: ["ADR-0001"] },
    );
    const report = analyzeGraph(ctx);
    expect(report.coverage.find((row) => row.key === "BR-001")).toEqual({
      key: "BR-001",
      hasTask: true,
      taskIds: ["TASK-001", "US-001"],
      notes: "",
    });
    expect(report.coverage.find((row) => row.key === "ADR-0001")).toEqual({
      key: "ADR-0001",
      hasTask: true,
      taskIds: ["US-001"],
      notes: "",
    });
  });

  it("skips draft rules, proposed ADRs, and template criteria", () => {
    const ctx = fixture(
      {
        "docs/business-rules/BR-001-r.md": rule("BR-001", { status: "draft" }),
        "docs/adr/ADR-0001-a.md": adr("ADR-0001", { status: "proposed" }),
      },
      {},
      `## Story\n\nAs a user.\n\n## Acceptance criteria\n\n- [ ] ${TEMPLATE_CRITERION}\n`,
    );
    const report = analyzeGraph(ctx);
    expect(report.ok).toBe(true);
    expect(report.coveragePercent).toBe(100);
    expect(report.coverage.map((row) => row.key)).toEqual([]);
  });

  it("fails ok for done stories with open child tasks", () => {
    const ctx = fixture(
      {
        "docs/backlog/tasks/TASK-001-open.md": task("TASK-001", "US-001", { status: "todo" }),
        "docs/backlog/tasks/TASK-002-done.md": task("TASK-002", "US-001", { status: "done" }),
      },
      { status: "done" },
    );
    const report = analyzeGraph(ctx);
    expect(report.ok).toBe(false);
    expect(report.coverage.find((row) => row.key === "US-001")).toEqual({
      key: "US-001",
      hasTask: true,
      taskIds: ["TASK-001"],
      notes: "done with open child tasks",
    });
  });

  it("does not fail ok when a done story's children are done or cancelled", () => {
    const ctx = fixture(
      {
        "docs/backlog/tasks/TASK-001-d.md": task("TASK-001", "US-001", { status: "done" }),
        "docs/backlog/tasks/TASK-002-c.md": task("TASK-002", "US-001", { status: "cancelled" }),
      },
      { status: "done" },
    );
    expect(analyzeGraph(ctx).ok).toBe(true);
    expect(analyzeGraph(ctx).coverage.some((row) => row.notes.includes("open child"))).toBe(false);
  });

  it("marks criteria covered by covers tokens and does not fail ok for remaining gaps", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story(
        "US-001",
        "EPIC-001",
        {},
        "## Story\n\nAs a user.\n\n## Acceptance criteria\n\n- [ ] first\n- [ ] second\n",
      ),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", { covers: ["US-001#1"] }),
    });
    const report = analyzeGraph(ctx);
    expect(report.ok).toBe(true);
    expect(report.coveragePercent).toBe(50);
    expect(report.coverage.find((row) => row.key === "US-001#1")).toEqual({
      key: "US-001#1",
      hasTask: true,
      taskIds: ["TASK-001"],
      notes: "",
    });
    expect(report.coverage.find((row) => row.key === "US-001#2")).toEqual({
      key: "US-001#2",
      hasTask: false,
      taskIds: [],
      notes: "no covering task",
    });
  });

  it("does not re-report dangling-ref, cycle, or unknown-field", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-e.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", {
        business_rules: ["BR-MISSING"],
        depends_on: ["US-002"],
      }),
      "docs/backlog/stories/US-002-s.md": story("US-002", "EPIC-001", { depends_on: ["US-001"] }),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001").replace(
        "updated: 2026-08-23",
        "updated: 2026-08-23\nmystery: nope",
      ),
    });
    const lintResult = lint(ctx);
    const lintCodes = [...lintResult.errors, ...lintResult.warnings].map((d) => d.code);
    expect(lintCodes).toEqual(
      expect.arrayContaining(["dangling-ref", "dependency-cycle", "unknown-field"]),
    );
    const dumped = JSON.stringify(analyzeGraph(ctx));
    expect(dumped).not.toContain("dangling-ref");
    expect(dumped).not.toContain("dependency-cycle");
    expect(dumped).not.toContain("unknown-field");
  });
});

describe("complete analyze", () => {
  it("offers the analyze command", () => {
    const ctx = fixture();
    expect(complete(ctx, [""]).map((h) => h.value)).toContain("analyze");
  });
});

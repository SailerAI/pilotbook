import { describe, expect, it } from "vitest";
import { dumpDefaultConfig } from "../src/core/config.ts";
import { sessionStart } from "../src/ops/hooks.ts";
import { epic, makeProject, rule, story, task } from "./helpers.ts";

function graph(files: Record<string, string> = {}) {
  return makeProject({
    "docs/backlog/epics/EPIC-001-one.md": epic("EPIC-001", { title: "Ledger" }),
    "docs/backlog/stories/US-001-s.md": story(
      "US-001",
      "EPIC-001",
      { title: "Post tx", business_rules: ["BR-001"] },
      "## Story\n\nPost a transaction.\n\n## Acceptance criteria\n\n- [ ] Amounts are strings\n",
    ),
    "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", { title: "API" }),
    "docs/backlog/tasks/TASK-002-t.md": task("TASK-002", "US-001", { title: "UI" }),
    "docs/business-rules/BR-001-r.md": rule("BR-001", { title: "Money" }),
    ...files,
  });
}

describe("session-start priming", () => {
  it("inlines the brief of the in-progress item", () => {
    const ctx = graph({
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", {
        title: "API",
        status: "in-progress",
      }),
    });
    const text = sessionStart(ctx);
    expect(text).toContain("# Brief: TASK-001");
    expect(text).toContain("MUST keep money as strings.");
    expect(text).toContain("Amounts are strings");
    // BR-003: the brief is the instruction, so the redundant pointer to it goes away.
    expect(text).not.toContain("Run `pb brief <ID>` before implementing.");
    expect(text).not.toContain("## Next ready");
  });

  it("falls back to the next-ready list when nothing is in progress", () => {
    const text = sessionStart(graph());
    expect(text).not.toContain("# Brief:");
    expect(text).toContain("## Next ready");
    expect(text).toContain("TASK-001");
    expect(text).toContain("Run `pb brief <ID>` before implementing.");
  });

  it("primes under hooks.prime_budget and surfaces the truncation diagnostic", () => {
    const ctx = graph({
      "pilotbook.config.yml": dumpDefaultConfig().replace("prime_budget: 6000", "prime_budget: 1"),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", {
        title: "API",
        status: "in-progress",
      }),
    });
    expect(ctx.project.config.hooks.primeBudget).toBe(1);
    const text = sessionStart(ctx);
    expect(text).toContain("# Brief: TASK-001");
    expect(text).toContain("brief_truncated");
    expect(text).toContain("Fix: `pb brief TASK-001 --budget");
  });

  it("primes the highest-priority in-progress item and names the rest", () => {
    const ctx = graph({
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", {
        title: "API",
        status: "in-progress",
        priority: "P2",
      }),
      "docs/backlog/tasks/TASK-002-t.md": task("TASK-002", "US-001", {
        title: "UI",
        status: "in-progress",
        priority: "P0",
      }),
    });
    const text = sessionStart(ctx);
    expect(text).toContain("# Brief: TASK-002");
    expect(text).not.toContain("# Brief: TASK-001");
    expect(text).toContain("Also in progress, not primed: TASK-001.");
  });
});

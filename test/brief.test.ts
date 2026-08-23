import { describe, expect, it } from "vitest";
import { PilotbookError } from "../src/ops/context.ts";
import { createItem, deleteItem, updateItem } from "../src/ops/items.ts";
import { briefOf, explain, nextReady } from "../src/ops/query.ts";
import { adr, epic, makeProject, rule, story, task } from "./helpers.ts";

function graph() {
  return makeProject({
    "docs/backlog/epics/EPIC-001-one.md": epic("EPIC-001", { title: "Ledger" }),
    "docs/backlog/stories/US-001-s.md": story(
      "US-001",
      "EPIC-001",
      { title: "Post tx", business_rules: ["BR-001"], adrs: ["ADR-0001"] },
      "## Story\n\nPost a transaction.\n\n## Acceptance criteria\n\n- [ ] Amounts are strings\n",
    ),
    "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", {
      title: "API",
      area: "backend",
    }),
    "docs/backlog/tasks/TASK-002-done.md": task("TASK-002", "US-001", {
      title: "Done sib",
      status: "done",
    }),
    "docs/adr/ADR-0001-d.md": adr(
      "ADR-0001",
      { title: "Hono", superseded_by: ["ADR-0002"] },
      "## Decision\n\nUse Hono.\n",
    ),
    "docs/adr/ADR-0002-e.md": adr(
      "ADR-0002",
      { title: "Still Hono", status: "accepted" },
      "## Decision\n\nStill Hono.\n",
    ),
    "docs/business-rules/BR-001-r.md": rule("BR-001", { title: "Money", related: ["BR-002"] }),
    "docs/business-rules/BR-002-r.md": rule("BR-002", { title: "Rounding", status: "deprecated" }),
  });
}

describe("brief", () => {
  it("includes rules and ADRs before prose and surfaces supersession", () => {
    const ctx = graph();
    const { brief, text } = briefOf(ctx, "TASK-001");
    const roles = brief.sections.map((s) => s.role);
    expect(roles.indexOf("rule")).toBeLessThan(roles.indexOf("target"));
    expect(text).toContain("SUPERSEDED");
    expect(text).toContain("DEPRECATED");
    expect(text).toContain("BR-001");
    expect(text).toContain("Amounts are strings");
  });

  it("honours a token budget without cutting the first section", () => {
    const ctx = graph();
    const { brief } = briefOf(ctx, "TASK-001", { budget: 80 });
    expect(brief.sections.length).toBeGreaterThan(0);
    expect(brief.truncated).toBe(true);
    expect(brief.sections[0]?.id).toBeTruthy();
  });

  it("snapshot markdown", () => {
    const ctx = graph();
    const { text } = briefOf(ctx, "TASK-001");
    expect(text).toMatchSnapshot();
  });
});

describe("crud + write-time", () => {
  it("creates a story under an epic", () => {
    const ctx = graph();
    const created = createItem(ctx, { type: "story", title: "Invite members", epic: "EPIC-001" });
    expect(created.id).toBe("US-002");
    expect(created.rel).toContain("US-002-invite-members.md");
  });

  it("rejects dangling parent at write time", () => {
    const ctx = graph();
    expect(() => createItem(ctx, { type: "story", title: "X", epic: "EPIC-999" })).toThrow(
      PilotbookError,
    );
  });

  it("rejects cycles at write time", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { depends_on: ["EPIC-002"] }),
      "docs/backlog/epics/EPIC-002-b.md": epic("EPIC-002"),
    });
    expect(() => updateItem(ctx, "EPIC-002", { data: { depends_on: ["EPIC-001"] } })).toThrow(
      /cycle/,
    );
  });

  it("refuses delete when referenced", () => {
    const ctx = graph();
    expect(() => deleteItem(ctx, "EPIC-001")).toThrow(/referenced/);
  });
});

describe("next / explain", () => {
  it("lists unblocked work", () => {
    const ctx = graph();
    const ready = nextReady(ctx);
    expect(ready.some((r) => r.id === "TASK-001")).toBe(true);
    expect(ready.some((r) => r.id === "TASK-002")).toBe(false);
  });

  it("explains blockers", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/epics/EPIC-002-b.md": epic("EPIC-002", {
        depends_on: ["EPIC-001"],
        status: "todo",
      }),
    });
    const e = explain(ctx, "EPIC-002");
    expect(e.blockedBy).toContain("EPIC-001");
  });
});

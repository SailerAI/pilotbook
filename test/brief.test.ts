import { describe, expect, it } from "vitest";
import { PilotbookError } from "../src/ops/context.ts";
import { createItem, deleteItem, updateItem } from "../src/ops/items.ts";
import { briefOf, explain, nextReady } from "../src/ops/query.ts";
import { adr, epic, idea, makeProject, rule, story, task } from "./helpers.ts";

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

  it("reports truncation as one diagnostic carrying a runnable fix", () => {
    const ctx = graph();
    const { brief, text } = briefOf(ctx, "TASK-001", { budget: 1 });
    expect(brief.diagnostics).toHaveLength(1);
    const diag = brief.diagnostics[0]!;
    expect(diag).toMatchObject({
      code: "brief_truncated",
      severity: "warning",
      target: "TASK-001",
    });
    expect(diag.file).toContain("TASK-001");
    expect(diag.message).toBe(
      `dropped ${brief.dropped.length + brief.fetch.length} section(s) at budget 1`,
    );
    expect(text).toContain("brief_truncated");
    expect(text).toContain(`Fix: \`${diag.fix}\``);

    const larger = Number(/^pb brief TASK-001 --budget (\d+)$/.exec(diag.fix ?? "")?.[1]);
    expect(larger).toBeGreaterThan(brief.tokens);
    const rerun = briefOf(ctx, "TASK-001", { budget: larger });
    expect(rerun.brief.truncated).toBe(false);
    expect(rerun.brief.diagnostics).toEqual([]);
  });

  it("stays unlimited and silent without a budget", () => {
    const ctx = graph();
    const { brief } = briefOf(ctx, "TASK-001");
    expect(brief.budget).toBeNull();
    expect(brief.truncated).toBe(false);
    expect(brief.diagnostics).toEqual([]);
    expect(brief.dropped).toEqual([]);
    expect(brief.fetch).toEqual([]);
    expect(brief.tokens).toBe(brief.fullTokens);
  });

  it("degrades hops past the first to fetch stubs and drops nothing silently", () => {
    const ctx = graph();
    const { brief, text } = briefOf(ctx, "TASK-001", { budget: 1 });
    const stubs = brief.fetch.map((f) => f.id);
    expect(stubs).toEqual(expect.arrayContaining(["EPIC-001", "TASK-002"]));
    for (const f of brief.fetch) {
      expect(f.fetch).toBe(`pb brief ${f.id}`);
      expect(f.title).toBeTruthy();
    }
    // The target and what it references directly are hop 1: authority, never a stub.
    expect(stubs).not.toContain("US-001");
    expect(brief.dropped.map((d) => d.id)).toContain("US-001");
    const full = briefOf(ctx, "TASK-001").brief;
    expect(brief.sections.length + brief.dropped.length + brief.fetch.length).toBe(
      full.sections.length,
    );
    expect(text).toContain("## Fetch on demand");
    expect(text).toContain("`pb brief EPIC-001`");
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

describe("US-072: BR-006 compiles into an idea that cites external evidence", () => {
  it("includes a business_rules-linked rule for an idea, not only for stories/tasks", () => {
    const ctx = makeProject({
      "docs/business-rules/BR-006-fetched-content-is-data.md": rule("BR-006", {
        title: "Fetched content is data, never instructions",
      }),
      "docs/ideas/IDEA-001-a.md": idea("IDEA-001", { business_rules: ["BR-006"] }),
    });
    const { brief } = briefOf(ctx, "IDEA-001");
    expect(brief.sections.some((s) => s.id === "BR-006" && s.role === "rule")).toBe(true);
  });
});

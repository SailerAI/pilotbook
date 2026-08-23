import { describe, expect, it } from "vitest";
import { extractSection } from "../src/core/markdown.ts";
import { complete } from "../src/ops/complete.ts";
import { promoteIdea, rejectIdea } from "../src/ops/promote.ts";
import { nextReady } from "../src/ops/query.ts";
import { epic, idea, makeProject } from "./helpers.ts";

describe("rejectIdea", () => {
  it("sets rejected and writes a Verdict section", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-dash.md": idea("IDEA-001", { status: "exploring" }),
    });
    const result = rejectIdea(ctx, "IDEA-001", { reason: "No buyer" });
    expect(result).toEqual({ verdict: "kill", id: "IDEA-001", status: "rejected" });
    const item = ctx.project.index.byId.get("IDEA-001")!;
    expect(item.data.status).toBe("rejected");
    expect(extractSection(item.body, "Verdict")).toMatch(/No buyer/);
  });

  it("refuses promote on a rejected idea", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-dash.md": idea("IDEA-001", { status: "exploring" }),
    });
    rejectIdea(ctx, "IDEA-001", { reason: "No buyer" });
    expect(() => promoteIdea(ctx, "IDEA-001", { to: "epic", title: "Nope" })).toThrow(/rejected/);
  });

  it("does not list rejected work in nextReady", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { status: "rejected" }),
      "docs/ideas/IDEA-001-dash.md": idea("IDEA-001", { status: "rejected" }),
    });
    expect(nextReady(ctx).some((i) => i.id === "EPIC-001")).toBe(false);
    expect(nextReady(ctx).some((i) => i.id === "IDEA-001")).toBe(false);
  });

  it("completes reject against idea ids", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-dash.md": idea("IDEA-001", { title: "Dash" }),
    });
    expect(complete(ctx, [""]).map((h) => h.value)).toEqual(
      expect.arrayContaining(["promote", "reject", "clarify"]),
    );
    expect(complete(ctx, ["reject", "IDE"]).some((h) => h.value === "IDEA-001")).toBe(true);
  });
});

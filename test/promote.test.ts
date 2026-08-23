import { describe, expect, it } from "vitest";
import { complete } from "../src/ops/complete.ts";
import { PilotbookError } from "../src/ops/context.ts";
import { getItem, listItems } from "../src/ops/items.ts";
import { promoteIdea, rejectIdea } from "../src/ops/promote.ts";
import { nextReady } from "../src/ops/query.ts";
import { epic, idea, makeProject } from "./helpers.ts";

const FILLED_WHY = `## Why

Builders need a discovery funnel so vague demand becomes a linked epic.

## Sketch

Promote along promoted_to.

## Open questions

- None

## Why not now

Need impact and effort.
`;

describe("promoteIdea", () => {
  it("promotes an exploring idea to a new epic and sets promoted_to", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", {
        title: "Discovery funnel",
        status: "exploring",
      }),
    });
    const result = promoteIdea(ctx, "IDEA-001", { to: "epic", title: "What to build" });
    expect(result.dryRun).toBe(false);
    expect(result.type).toBe("epic");
    expect(result.title).toBe("What to build");
    expect(result.created?.id).toBe("EPIC-001");
    expect(result.idea?.data.status).toBe("promoted");
    expect(result.idea?.data.promoted_to).toEqual(["EPIC-001"]);
    expect(getItem(ctx, "IDEA-001").data.status).toBe("promoted");
    expect(getItem(ctx, "EPIC-001").data.title).toBe("What to build");
  });

  it("promotes a raw idea when Why, impact, and effort are filled", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea(
        "IDEA-001",
        { status: "raw", impact: "high", effort: "medium" },
        FILLED_WHY,
      ),
    });
    const result = promoteIdea(ctx, "IDEA-001", { to: "epic", title: "What to build" });
    expect(result.created?.id).toBe("EPIC-001");
    expect(getItem(ctx, "IDEA-001").data.status).toBe("promoted");
  });

  it("promotes to a story under an existing epic", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Ledger" }),
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "exploring" }),
    });
    const result = promoteIdea(ctx, "IDEA-001", {
      to: "story",
      title: "Clarify items",
      epic: "EPIC-001",
    });
    expect(result.created?.id).toBe("US-001");
    expect(result.created?.data.epic).toBe("EPIC-001");
    expect(getItem(ctx, "IDEA-001").data.promoted_to).toEqual(["US-001"]);
  });

  it("dry-run names type and title and writes nothing", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "exploring" }),
    });
    const before = listItems(ctx).items.length;
    const result = promoteIdea(ctx, "IDEA-001", {
      to: "epic",
      title: "What to build",
      dryRun: true,
    });
    expect(result).toEqual({ dryRun: true, type: "epic", title: "What to build" });
    expect(listItems(ctx).items.length).toBe(before);
    expect(getItem(ctx, "IDEA-001").data.status).toBe("exploring");
  });

  it("dry-run to story includes the parent epic", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "exploring" }),
    });
    const result = promoteIdea(ctx, "IDEA-001", {
      to: "story",
      title: "Clarify",
      epic: "EPIC-001",
      dryRun: true,
    });
    expect(result).toMatchObject({
      dryRun: true,
      type: "story",
      title: "Clarify",
      epic: "EPIC-001",
    });
    expect(result.created).toBeUndefined();
  });

  it("refuses a raw idea with placeholder Why and returns a fix command", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "raw" }),
    });
    try {
      promoteIdea(ctx, "IDEA-001", { to: "epic", title: "What to build" });
      expect.fail("expected refusal");
    } catch (err) {
      expect(err).toBeInstanceOf(PilotbookError);
      const e = err as PilotbookError;
      expect(e.code).toBe("not-ready");
      expect(e.fix).toBe("pb clarify IDEA-001");
    }
  });

  it("refuses a raw idea missing impact", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "raw", impact: "" }, FILLED_WHY),
    });
    expect(() => promoteIdea(ctx, "IDEA-001", { to: "epic", title: "X" })).toThrow(PilotbookError);
  });

  it("refuses a rejected idea", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "rejected" }),
    });
    expect(() => promoteIdea(ctx, "IDEA-001", { to: "epic", title: "X" })).toThrow(/rejected/);
  });

  it("refuses story promote without an epic", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "exploring" }),
    });
    expect(() => promoteIdea(ctx, "IDEA-001", { to: "story", title: "X" })).toThrow(/--epic/);
  });

  it("refuses unknown ids and non-ideas", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
    });
    expect(() => promoteIdea(ctx, "IDEA-999", { to: "epic", title: "X" })).toThrow(/not found/);
    expect(() => promoteIdea(ctx, "EPIC-001", { to: "epic", title: "X" })).toThrow(/not an idea/);
  });
});

describe("rejectIdea", () => {
  it("sets rejected, upserts Verdict, and returns verdict kill", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "exploring" }),
    });
    const result = rejectIdea(ctx, "IDEA-001", { reason: "No sponsor" });
    expect(result).toEqual({ verdict: "kill", id: "IDEA-001", status: "rejected" });
    const item = getItem(ctx, "IDEA-001");
    expect(item.data.status).toBe("rejected");
    expect(item.body).toMatch(/## Verdict/);
    expect(item.body).toContain("No sponsor");
  });

  it("refuses promote on a rejected idea", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "exploring" }),
    });
    rejectIdea(ctx, "IDEA-001", { reason: "Out of scope" });
    expect(() => promoteIdea(ctx, "IDEA-001", { to: "epic", title: "X" })).toThrow(/rejected/);
  });

  it("keeps rejected ideas out of nextReady", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { status: "todo" }),
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { status: "rejected" }),
    });
    const ids = nextReady(ctx).map((r) => r.id);
    expect(ids).toContain("EPIC-001");
    expect(ids).not.toContain("IDEA-001");
  });
});

describe("complete promote", () => {
  it("completes --to epic|story and idea ids", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-funnel.md": idea("IDEA-001", { title: "Funnel" }),
    });
    expect(complete(ctx, ["promote", "--to", "e"]).map((h) => h.value)).toContain("epic");
    expect(complete(ctx, ["promote", "IDEA"]).some((h) => h.value === "IDEA-001")).toBe(true);
  });
});

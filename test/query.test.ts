import { describe, expect, it } from "vitest";
import { hostJoin } from "../src/core/config.ts";
import { complete } from "../src/ops/complete.ts";
import { writeBoard } from "../src/ops/items.ts";
import { itemState, listReady, nextReady, searchGraph, statusOf } from "../src/ops/query.ts";
import { epic, makeProject, story, task } from "./helpers.ts";

function sample() {
  return makeProject({
    "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Ledger" }),
    "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", { title: "Post tx" }),
    "docs/backlog/tasks/TASK-010-resume.md": task("TASK-010", "US-001", {
      title: "Resume me",
      status: "in-progress",
      phase: 2,
      priority: "P2",
    }),
    "docs/backlog/tasks/TASK-011-review.md": task("TASK-011", "US-001", {
      title: "In review",
      status: "review",
      phase: 1,
      priority: "P0",
    }),
    "docs/backlog/tasks/TASK-012-ready.md": task("TASK-012", "US-001", {
      title: "Ready low phase",
      status: "todo",
      phase: 1,
      priority: "P1",
    }),
    "docs/backlog/tasks/TASK-013-ready-later.md": task("TASK-013", "US-001", {
      title: "Ready later phase",
      status: "todo",
      phase: 3,
      priority: "P0",
    }),
    "docs/backlog/tasks/TASK-014-backlog.md": task("TASK-014", "US-001", {
      title: "Backlog item",
      status: "backlog",
      phase: 1,
      priority: "P0",
    }),
    "docs/backlog/tasks/TASK-015-blocked.md": task("TASK-015", "US-001", {
      title: "Blocked on 016",
      status: "todo",
      depends_on: ["TASK-016"],
    }),
    "docs/backlog/tasks/TASK-016-blockee.md": task("TASK-016", "US-001", {
      title: "Still open blocker",
      status: "todo",
      phase: 1,
      priority: "P3",
    }),
    "docs/backlog/tasks/TASK-017-done.md": task("TASK-017", "US-001", {
      title: "Already shipped",
      status: "done",
    }),
    "docs/backlog/tasks/TASK-018-remote.md": task("TASK-018", "US-001", {
      title: "Remote dep",
      status: "todo",
      depends_on: ["api#TASK-999"],
    }),
    "docs/backlog/tasks/TASK-019-unlocks.md": task("TASK-019", "US-001", {
      title: "Waits on 017",
      status: "todo",
      depends_on: ["TASK-017"],
    }),
  });
}

describe("statusOf / listReady", () => {
  it("always includes requires, even when ready and empty", () => {
    const ctx = sample();
    const s = statusOf(ctx, "TASK-012");
    expect(s.state).toBe("ready");
    expect(s.requires).toEqual([]);
    expect(s.missingDeps).toEqual([]);
    expect(Array.isArray(s.unlocks)).toBe(true);
  });

  it("lists every depends_on in requires and only unmet local blockers in missingDeps", () => {
    const ctx = sample();
    const blocked = statusOf(ctx, "TASK-015");
    expect(blocked.state).toBe("blocked");
    expect(blocked.requires).toEqual([{ id: "TASK-016", state: "ready" }]);
    expect(blocked.missingDeps).toEqual(["TASK-016"]);

    const waitingOnDone = statusOf(ctx, "TASK-019");
    expect(waitingOnDone.state).toBe("ready");
    expect(waitingOnDone.requires).toEqual([{ id: "TASK-017", state: "done" }]);
    expect(waitingOnDone.missingDeps).toEqual([]);
  });

  it("treats remote repo#ID refs as requires that do not block", () => {
    const ctx = sample();
    const item = ctx.project.index.byId.get("TASK-018")!;
    expect(itemState(item, ctx.project.index.byId)).toBe("ready");
    const s = statusOf(ctx, "TASK-018");
    expect(s.state).toBe("ready");
    expect(s.requires).toEqual([{ id: "api#TASK-999", state: "remote" }]);
    expect(s.missingDeps).toEqual([]);
  });

  it("reports one-hop unlocks", () => {
    const ctx = sample();
    const s = statusOf(ctx, "TASK-016");
    expect(s.unlocks).toEqual([
      expect.objectContaining({ id: "TASK-015", state: "blocked", title: "Blocked on 016" }),
    ]);
  });

  it("lists ready work in declaration order when there are no ready-to-ready edges", () => {
    const ctx = sample();
    const ids = listReady(ctx)
      .map((i) => i.id)
      .filter((id) => id.startsWith("TASK-"));
    expect(ids).toContain("TASK-012");
    expect(ids).not.toContain("TASK-015");
    expect(ids).not.toContain("TASK-017");
    const a = ids.indexOf("TASK-012");
    const b = ids.indexOf("TASK-013");
    expect(a).toBeGreaterThanOrEqual(0);
    expect(b).toBeGreaterThan(a);
  });
});

describe("nextReady ladder", () => {
  it("ranks resume, then review, then ready, then backlog, and omits blocked", () => {
    const ctx = sample();
    const rows = nextReady(ctx).filter((r) => r.id.startsWith("TASK-"));
    expect(rows.map((r) => r.id)).toEqual([
      "TASK-010",
      "TASK-011",
      "TASK-012",
      "TASK-018",
      "TASK-019",
      "TASK-016",
      "TASK-013",
      "TASK-014",
    ]);
    expect(rows.map((r) => r.ladder)).toEqual([
      "resume",
      "review",
      "ready",
      "ready",
      "ready",
      "ready",
      "ready",
      "backlog",
    ]);
    expect(rows.some((r) => r.id === "TASK-015")).toBe(false);
  });

  it("keeps phase-then-priority order inside a ladder rung", () => {
    const ctx = sample();
    const ready = nextReady(ctx).filter((r) => r.ladder === "ready" && r.id.startsWith("TASK-"));
    expect(ready.map((r) => r.id)).toEqual([
      "TASK-012",
      "TASK-018",
      "TASK-019",
      "TASK-016",
      "TASK-013",
    ]);
  });
});

describe("searchGraph", () => {
  it("ranks id/title hits before body and never dumps on empty query", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Ledger" }),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", { title: "Post tx" }),
      "docs/backlog/tasks/TASK-001-api.md": task(
        "TASK-001",
        "US-001",
        { title: "Transaction API" },
        "## Scope\n\nThe unique-body-token lives only here.\n",
      ),
      "docs/backlog/tasks/TASK-002-other.md": task("TASK-002", "US-001", {
        title: "Something else",
      }),
    });
    expect(searchGraph(ctx, "")).toEqual([]);
    expect(searchGraph(ctx, "   ")).toEqual([]);
    const titleHits = searchGraph(ctx, "TASK-001");
    expect(titleHits[0]).toMatchObject({
      type: "task",
      id: "TASK-001",
      title: "Transaction API",
      path: expect.stringContaining("TASK-001"),
      snippet: "Transaction API",
    });
    const bodyHits = searchGraph(ctx, "unique-body-token");
    expect(bodyHits).toHaveLength(1);
    expect(bodyHits[0]?.id).toBe("TASK-001");
    expect(bodyHits[0]?.snippet).toContain("unique-body-token");
  });
});

describe("writeBoard phase section", () => {
  it("groups by phase ascending and puts Unphased last", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Phased", phase: 2 }),
      "docs/backlog/epics/EPIC-002-b.md": `---
id: EPIC-002
title: No phase
type: epic
status: todo
priority: P1
estimate: 1
owner: unassigned
tags: []
depends_on: []
related: []
goal: x
created: 2026-08-23
updated: 2026-08-23
---
`,
    });
    const rel = writeBoard(ctx);
    const md = ctx.fs.readFile(hostJoin(ctx.project.projectRoot, rel));
    expect(md).toContain("## By phase");
    const phase2 = md.indexOf("### 2 (");
    const unphased = md.indexOf("### Unphased (");
    expect(phase2).toBeGreaterThan(md.indexOf("## By phase"));
    expect(unphased).toBeGreaterThan(phase2);
    expect(md).toContain("EPIC-001");
    expect(md).toContain("EPIC-002");
  });
});

describe("complete", () => {
  it("offers status and search commands", () => {
    const ctx = sample();
    const cmds = complete(ctx, [""]).map((h) => h.value);
    expect(cmds).toContain("status");
    expect(cmds).toContain("search");
  });
});

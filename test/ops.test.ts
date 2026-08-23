import { describe, expect, it } from "vitest";
import { MemoryFileSystem } from "../src/core/memory-fs.ts";
import { complete } from "../src/ops/complete.ts";
import { initProject } from "../src/ops/init.ts";
import { exportItems, writeManifest } from "../src/ops/interop.ts";
import { listItems, schemaOf } from "../src/ops/items.ts";
import { lint } from "../src/ops/query.ts";
import { seedFromBrief } from "../src/ops/seed.ts";
import { verifyItem } from "../src/ops/verify.ts";
import { epic, loadTemplate, makeProject, story, task } from "./helpers.ts";

describe("seed", () => {
  it("dry-run parses headings", () => {
    const ctx = makeProject();
    const result = seedFromBrief(
      ctx,
      `# Epic: Workspaces\ngoal: Isolated orgs\n\n## Story: Create workspace\n\n### Task: Schema\narea: db\n`,
      { dryRun: true },
    );
    expect(result.plan.map((p) => p.type)).toEqual(["epic", "story", "task"]);
  });

  it("creates files", () => {
    const ctx = makeProject();
    const result = seedFromBrief(
      ctx,
      `# Epic: Workspaces\n\n## Story: Create workspace\n\n### Task: Schema\narea: db\n`,
    );
    expect(result.created.map((c) => c.id)).toEqual(["EPIC-001", "US-001", "TASK-001"]);
  });
});

describe("complete", () => {
  it("completes IDs from the prefix", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Alpha" }),
    });
    const hits = complete(ctx, ["brief", "EP"]);
    expect(hits.some((h) => h.value === "EPIC-001")).toBe(true);
  });
});

describe("init", () => {
  it("writes config and dirs", () => {
    const fs = new MemoryFileSystem("/app");
    fs.seed({
      "templates/epic.md": loadTemplate("epic.md"),
      "templates/story.md": loadTemplate("story.md"),
      "templates/task.md": loadTemplate("task.md"),
      "templates/adr.md": loadTemplate("adr.md"),
      "templates/business-rule.md": loadTemplate("business-rule.md"),
      "templates/idea.md": loadTemplate("idea.md"),
    });
    const result = initProject("/app", { ai: true }, fs);
    expect(result.wrote).toContain("pilotbook.config.yml");
    expect(fs.exists("/app/AGENTS.md")).toBe(true);
    const rule = fs.readFile("/app/.cursor/rules/pilotbook.mdc");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).not.toContain("globs: docs/**/*.md");
  });
});

describe("manifest / export", () => {
  it("writes graph.json", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
    });
    const { manifest } = writeManifest(ctx);
    expect(manifest.items[0]?.id).toBe("EPIC-001");
  });

  it("dry-run export to jira", async () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
    });
    const payload = await exportItems(ctx, "jira", { dryRun: true });
    expect(payload.dryRun).toBe(true);
    expect(payload.items.length).toBeGreaterThan(0);
  });
});

describe("schemaOf", () => {
  it("exposes parent field names from type config", () => {
    const sch = schemaOf(makeProject());
    expect(sch.types.story?.parent).toBe("epic");
    expect(sch.types.task?.parent).toBe("story");
    expect(sch.types.epic?.parent).toBeUndefined();
  });

  it("lets a client find children from schema parent + items", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001"),
    });
    const sch = schemaOf(ctx);
    const { items } = listItems(ctx);
    const kids = (parentId: string) =>
      items.filter((item) => {
        const field = sch.types[item.type]?.parent;
        return field && item.data[field] === parentId;
      });
    expect(kids("EPIC-001").map((i) => i.id)).toEqual(["US-001"]);
    expect(kids("US-001").map((i) => i.id)).toEqual(["TASK-001"]);
    expect(kids("TASK-001")).toEqual([]);
  });
});

describe("verify gate", () => {
  it("stamps hash and lint accepts done without checks configured", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", { status: "done" }),
    });
    const r = verifyItem(ctx, "TASK-001");
    expect(r.hash).toHaveLength(12);
    expect(lint(ctx).errors.filter((e) => e.code === "unverified-done")).toHaveLength(0);
  });
});

describe("cross-repo refs", () => {
  it("resolves peer manifests", () => {
    const ctx = makeProject({
      "pilotbook.config.yml": `root: docs
peers:
  - name: api
    manifest: peers/api.json
`,
      "peers/api.json": JSON.stringify({
        name: "api",
        items: [{ id: "TASK-009", type: "task", title: "Other", status: "done" }],
      }),
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { depends_on: ["api#TASK-009"] }),
    });
    const errors = lint(ctx).errors.filter((e) => e.code === "dangling-ref");
    expect(errors).toEqual([]);
  });
});

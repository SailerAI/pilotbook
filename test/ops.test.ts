import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dumpDefaultConfig } from "../src/core/config.ts";
import { MemoryFileSystem } from "../src/core/memory-fs.ts";
import { complete } from "../src/ops/complete.ts";
import { initProject } from "../src/ops/init.ts";
import { exportItems, writeManifest } from "../src/ops/interop.ts";
import { bundledSkills, bundledTemplates, listItems, schemaOf } from "../src/ops/items.ts";
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

  it("completes instructions overview and skill names", () => {
    const ctx = makeProject();
    expect(complete(ctx, ["instructions", "ov"]).map((h) => h.value)).toContain("overview");
    expect(complete(ctx, ["skill", "imp"]).map((h) => h.value)).toContain("implement");
    expect(complete(ctx, ["in"]).map((h) => h.value)).toContain("instructions");
  });
});

describe("init", () => {
  const shippedSkills = [
    "implement",
    "groom",
    "prioritize",
    "architect",
    "discover",
    "shape",
  ] as const;

  function seedInitFs(): MemoryFileSystem {
    const fs = new MemoryFileSystem("/app");
    fs.seed({
      "templates/epic.md": loadTemplate("epic.md"),
      "templates/story.md": loadTemplate("story.md"),
      "templates/task.md": loadTemplate("task.md"),
      "templates/adr.md": loadTemplate("adr.md"),
      "templates/business-rule.md": loadTemplate("business-rule.md"),
      "templates/idea.md": loadTemplate("idea.md"),
    });
    return fs;
  }

  it("writes config, Cursor rule, and all six shipped skills", () => {
    const fs = seedInitFs();
    const result = initProject("/app", { ai: true }, fs);
    expect(result.wrote).toContain("pilotbook.config.yml");
    expect(fs.exists("/app/AGENTS.md")).toBe(true);
    const rule = fs.readFile("/app/.cursor/rules/pilotbook.mdc");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).not.toContain("globs: docs/**/*.md");
    for (const name of shippedSkills) {
      const claude = `.claude/skills/pilotbook-${name}.md`;
      const cursor = `.cursor/skills/${name}/SKILL.md`;
      expect(result.wrote, `missing Claude skill ${name}`).toContain(claude);
      expect(result.wrote, `missing Cursor skill ${name}`).toContain(cursor);
      expect(fs.readFile(`/app/${claude}`)).toContain(`name: ${name}`);
      expect(fs.readFile(`/app/${cursor}`)).toContain(`name: ${name}`);
    }
  });

  it("still writes the Cursor rule and skills when .cursor is already present", () => {
    const fs = seedInitFs();
    fs.seed({ ".cursor/rules/keep.mdc": "existing" });
    const result = initProject("/app", {}, fs);
    expect(result.wrote).toContain(".cursor/rules/pilotbook.mdc");
    expect(fs.readFile("/app/.cursor/rules/pilotbook.mdc")).toContain("alwaysApply: true");
    for (const name of shippedSkills) {
      const rel = `.cursor/skills/${name}/SKILL.md`;
      expect(result.wrote, `missing Cursor skill ${name}`).toContain(rel);
      expect(fs.readFile(`/app/${rel}`)).toContain(`name: ${name}`);
    }
    expect(result.wrote.some((p) => p.startsWith(".claude/skills/"))).toBe(false);
  });

  it("skips existing skill files on re-run", () => {
    const fs = seedInitFs();
    initProject("/app", { ai: true }, fs);
    fs.writeFile("/app/.claude/skills/pilotbook-implement.md", "stale implement\n");
    fs.writeFile("/app/.cursor/skills/implement/SKILL.md", "stale cursor implement\n");
    const second = initProject("/app", { ai: true }, fs);
    expect(second.skipped).toContain(".claude/skills/pilotbook-implement.md");
    expect(second.skipped).toContain(".cursor/skills/implement/SKILL.md");
    expect(second.wrote).not.toContain(".claude/skills/pilotbook-implement.md");
    expect(second.wrote).not.toContain(".cursor/skills/implement/SKILL.md");
    expect(fs.readFile("/app/.claude/skills/pilotbook-implement.md")).toBe("stale implement\n");
    expect(fs.readFile("/app/.cursor/skills/implement/SKILL.md")).toBe("stale cursor implement\n");
  });

  it("refreshes a legacy shipped skill and skips an edited one", () => {
    const fs = seedInitFs();
    initProject("/app", { ai: true }, fs);
    const bundled = fs.readFile("/app/.claude/skills/pilotbook-discover.md");
    const legacy = loadTemplate("../test/fixtures/legacy-discover.md");
    fs.writeFile("/app/.claude/skills/pilotbook-discover.md", legacy);
    fs.writeFile("/app/.claude/skills/pilotbook-implement.md", "user rewrote this skill\n");
    const second = initProject("/app", { ai: true, refreshSkills: true }, fs);
    expect(second.wrote).toContain(".claude/skills/pilotbook-discover.md");
    expect(fs.readFile("/app/.claude/skills/pilotbook-discover.md")).toBe(bundled);
    expect(second.skipped).toContain(".claude/skills/pilotbook-implement.md");
    expect(fs.readFile("/app/.claude/skills/pilotbook-implement.md")).toBe(
      "user rewrote this skill\n",
    );
  });

  it("points a fresh AGENTS.md at pb instructions overview", () => {
    const fs = seedInitFs();
    initProject("/app", { ai: true }, fs);
    const agents = fs.readFile("/app/AGENTS.md");
    expect(agents).toContain("pb instructions overview");
    expect(agents).toContain("pb skill discover");
    expect(agents).not.toContain("skills/implement.md");
    expect(agents).not.toContain(".cursor/skills/groom");
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

describe("bundledTemplates", () => {
  it("resolves the package templates directory", () => {
    expect(existsSync(path.join(bundledTemplates(), "idea.md"))).toBe(true);
  });
});

describe("bundledSkills", () => {
  it("resolves the package skills directory", () => {
    expect(existsSync(path.join(bundledSkills(), "implement.md"))).toBe(true);
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

const REPORT = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="vitest">
<testsuite name="test/a.test.ts" tests="2">
<testcase classname="test/a.test.ts" name="passes" time="0.01"></testcase>
<testcase classname="test/a.test.ts" name="fails" time="0.02"><failure message="nope"/></testcase>
</testsuite>
</testsuites>
`;

function reportProject(files: Record<string, string> = {}) {
  return makeProject({
    "pilotbook.config.yml": dumpDefaultConfig().replace(
      "  # report: .pb/junit.xml",
      "  report: .pb/junit.xml",
    ),
    "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
    "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
    "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001"),
    ...files,
  });
}

describe("verify report", () => {
  it("US-023#2 parses the configured report into per-test results", () => {
    const ctx = reportProject({ ".pb/junit.xml": REPORT });
    const r = verifyItem(ctx, "TASK-001");
    expect(r.results).toEqual([
      { classname: "test/a.test.ts", name: "passes", status: "pass", time: 0.01 },
      { classname: "test/a.test.ts", name: "fails", status: "fail", time: 0.02 },
    ]);
    expect(r.ok).toBe(true);
    expect(r.checks).toEqual([]);
  });

  it("US-023#3 returns empty results without erroring when the report is absent", () => {
    const ctx = reportProject();
    const r = verifyItem(ctx, "TASK-001");
    expect(r.results).toEqual([]);
    expect(r.reportStale).toBe(false);
    expect(r.ok).toBe(true);
    expect(r.hash).toHaveLength(12);
  });

  it("US-023#4 leaves results empty when no report path is configured", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001"),
      ".pb/junit.xml": REPORT,
    });
    const r = verifyItem(ctx, "TASK-001");
    expect(r.results).toEqual([]);
    expect(r.reportStale).toBe(false);
  });

  it("US-023#2 flags a report no command rewrote as stale", () => {
    const ctx = reportProject({ ".pb/junit.xml": REPORT });
    expect(verifyItem(ctx, "TASK-001").reportStale).toBe(true);
  });

  it("US-023#3 returns empty results for a corrupt report rather than throwing", () => {
    const ctx = reportProject({ ".pb/junit.xml": `<testsuite><testcase name="cut off"` });
    const r = verifyItem(ctx, "TASK-001");
    expect(r.results).toEqual([]);
    expect(r.ok).toBe(true);
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

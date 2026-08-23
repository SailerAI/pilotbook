import { describe, expect, it } from "vitest";
import { builtinTypes } from "../src/core/defaults.ts";
import { parseFrontmatter, serializeItem } from "../src/core/frontmatter.ts";
import { lint } from "../src/ops/query.ts";
import { adr, epic, makeProject, rule, story, task } from "./helpers.ts";

function healthy(): ReturnType<typeof makeProject> {
  return makeProject({
    "docs/backlog/epics/EPIC-001-one.md": epic("EPIC-001", { title: "One" }),
    "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", {
      title: "Story",
      business_rules: ["BR-001"],
      adrs: ["ADR-0001"],
    }),
    "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", { title: "Task" }),
    "docs/adr/ADR-0001-d.md": adr("ADR-0001", { title: "Decision" }),
    "docs/business-rules/BR-001-r.md": rule("BR-001", { title: "Money" }),
  });
}

describe("lint", () => {
  it("accepts a healthy graph", () => {
    const ctx = healthy();
    const r = lint(ctx);
    expect(r.errors).toEqual([]);
  });

  it("missing-field", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-x.md": `---
id: EPIC-001
title: X
type: epic
status: todo
---
`,
    });
    expect(lint(ctx).errors.some((e) => e.code === "missing-field")).toBe(true);
  });

  it("unknown-field", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-x.md": epic("EPIC-001", { title: "X" }).replace(
        "updated: 2026-08-23",
        "updated: 2026-08-23\nextra: nope",
      ),
    });
    expect(lint(ctx).errors.some((e) => e.code === "unknown-field")).toBe(true);
  });

  it("duplicate-id", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "A" }),
      "docs/backlog/epics/EPIC-001-b.md": epic("EPIC-001", { title: "B" }),
    });
    expect(lint(ctx).errors.some((e) => e.code === "duplicate-id")).toBe(true);
  });

  it("filename-mismatch", () => {
    const ctx = makeProject({
      "docs/backlog/epics/wrong.md": epic("EPIC-001", { title: "X" }),
    });
    expect(lint(ctx).errors.some((e) => e.code === "filename-mismatch")).toBe(true);
  });

  it("dangling-ref parent", () => {
    const ctx = makeProject({
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-999"),
    });
    expect(lint(ctx).errors.some((e) => e.code === "dangling-ref")).toBe(true);
  });

  it("wrong-type-ref", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-x.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", { adrs: ["EPIC-001"] }),
    });
    expect(lint(ctx).errors.some((e) => e.code === "wrong-type-ref")).toBe(true);
  });

  it("invalid-enum", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-x.md": epic("EPIC-001").replace(
        "status: todo",
        "status: banana",
      ),
    });
    expect(lint(ctx).errors.some((e) => e.code === "invalid-enum")).toBe(true);
  });

  it("not-date", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-x.md": epic("EPIC-001").replace(
        "created: 2026-08-23",
        "created: yesterday",
      ),
    });
    expect(lint(ctx).errors.some((e) => e.code === "not-date")).toBe(true);
  });

  it("dependency-cycle", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { depends_on: ["EPIC-002"] }),
      "docs/backlog/epics/EPIC-002-b.md": epic("EPIC-002", { depends_on: ["EPIC-001"] }),
    });
    expect(lint(ctx).errors.some((e) => e.code === "dependency-cycle")).toBe(true);
  });

  it("open-children warning", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-x.md": epic("EPIC-001", { status: "done" }),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", { status: "todo" }),
    });
    expect(lint(ctx).warnings.some((e) => e.code === "open-children")).toBe(true);
  });

  it("diagnostics include file:line:col", () => {
    const ctx = makeProject({
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-999"),
    });
    const d = lint(ctx).errors.find((e) => e.code === "dangling-ref");
    expect(d?.file).toContain("US-001");
    expect(d?.line).toBeGreaterThan(0);
    expect(d?.column).toBeGreaterThan(0);
    expect(d?.suggestion).toBeTruthy();
  });
});

describe("frontmatter round-trip", () => {
  it("parse then serialize is stable for LF", () => {
    const text = epic("EPIC-001", { title: "One" });
    const parsed = parseFrontmatter(text, "x.md");
    const cfg = builtinTypes().epic!;
    const out = serializeItem(parsed.data, parsed.body, cfg.required);
    const parsed2 = parseFrontmatter(out, "x.md");
    expect(parsed2.data).toEqual(parsed.data);
    expect(parsed2.body.trim()).toEqual(parsed.body.trim());
  });

  it("accepts CRLF", () => {
    const text = epic("EPIC-001", { title: "One" }).replaceAll("\n", "\r\n");
    const parsed = parseFrontmatter(text, "x.md");
    expect(parsed.data.id).toBe("EPIC-001");
    expect(parsed.data.title).toBe("One");
  });
});

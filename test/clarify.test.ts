import { describe, expect, it } from "vitest";
import { appendChecklistItem, parseChecklist, serializeChecklist } from "../src/core/checklist.ts";
import { extractSection, upsertSection } from "../src/core/markdown.ts";
import { applyClarifications, clarifyItem } from "../src/ops/clarify.ts";
import { PilotbookError } from "../src/ops/context.ts";
import { getItem, listItems } from "../src/ops/items.ts";
import { epic, idea, makeProject, rule, story } from "./helpers.ts";

describe("markdown helpers", () => {
  it("extracts and upserts a named heading without rewriting neighbors", () => {
    const body = "## Why\n\nOld why.\n\n## Sketch\n\nShape.\n";
    expect(extractSection(body, "Why")).toBe("Old why.");
    const next = upsertSection(body, "Why", "New why.");
    expect(extractSection(next, "Why")).toBe("New why.");
    expect(extractSection(next, "Sketch")).toBe("Shape.");
  });

  it("appends a missing heading", () => {
    const next = upsertSection("## Why\n\nKeep.\n", "Verdict", "2026-08-23 — no");
    expect(extractSection(next, "Why")).toBe("Keep.");
    expect(extractSection(next, "Verdict")).toBe("2026-08-23 — no");
  });

  it("round-trips a checklist and keeps prose when there are no boxes", () => {
    const items = parseChecklist("- [ ] one\n- [x] two\n");
    expect(items).toEqual([
      { index: 1, text: "one", checked: false },
      { index: 2, text: "two", checked: true },
    ]);
    expect(serializeChecklist(items)).toBe("- [ ] one\n- [x] two");
    const withProse = appendChecklistItem("## Notes\n\nProse only.\n", "A criterion", "Notes");
    expect(extractSection(withProse, "Notes")).toContain("Prose only.");
    expect(extractSection(withProse, "Notes")).toContain("- [ ] A criterion");
  });
});

describe("clarifyItem", () => {
  it("emits bounded options for a bare idea", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-raw.md": idea("IDEA-001"),
    });
    const result = clarifyItem(ctx, "IDEA-001");
    expect(result.ready).toBe(false);
    expect(result.questions.map((q) => q.id)).toEqual(["why", "sketch", "open-questions"]);
    expect(result.questions[0]?.options.map((o) => o.id)).toEqual([
      "criterion",
      "business-rule",
      "open-question",
    ]);
  });

  it("emits questions for a story missing criteria and rules", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", {}, "## Story\n\nVague.\n"),
    });
    const result = clarifyItem(ctx, "US-001");
    expect(result.questions.map((q) => q.id)).toEqual(["acceptance-criteria", "business-rules"]);
  });

  it("reports ready and writes nothing when detection is empty", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic(
        "EPIC-001",
        { goal: "Ship the funnel" },
        "## Outcome\n\nDone.\n",
      ),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", {
        business_rules: ["BR-001"],
      }),
      "docs/business-rules/BR-001-r.md": rule("BR-001"),
    });
    const before = listItems(ctx).items.map((i) => `${i.id}:${i.body}`);
    const result = clarifyItem(ctx, "US-001");
    expect(result).toEqual({ id: "US-001", ready: true, questions: [] });
    expect(listItems(ctx).items.map((i) => `${i.id}:${i.body}`)).toEqual(before);
  });

  it("refuses unknown ids", () => {
    const ctx = makeProject();
    expect(() => clarifyItem(ctx, "US-999")).toThrow(PilotbookError);
  });
});

describe("applyClarifications", () => {
  it("writes a criterion under Acceptance criteria", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story(
        "US-001",
        "EPIC-001",
        {},
        "## Story\n\nVague.\n\n## Acceptance criteria\n\n- [ ] Given …, when …, then …\n",
      ),
    });
    const result = applyClarifications(ctx, "US-001", [
      { question: "acceptance-criteria", option: "criterion", text: "Amounts are strings" },
    ]);
    expect(result.applied[0]?.kind).toBe("criterion");
    expect(getItem(ctx, "US-001").body).toContain("- [ ] Amounts are strings");
    expect(getItem(ctx, "US-001").body).not.toContain("Given …, when …, then …");
  });

  it("allocates a business-rule and links it", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-raw.md": idea("IDEA-001"),
    });
    const result = applyClarifications(ctx, "IDEA-001", [
      { question: "why", option: "business-rule", text: "IDs come from pb new" },
    ]);
    expect(result.applied[0]?.kind).toBe("business-rule");
    const brId = result.applied[0]?.detail;
    expect(brId).toMatch(/^BR-\d+$/);
    expect(getItem(ctx, "IDEA-001").data.related).toContain(brId);
    expect(getItem(ctx, brId!).data.title).toBe("IDs come from pb new");
  });

  it("logs an open question on an idea", () => {
    const ctx = makeProject({
      "docs/ideas/IDEA-001-raw.md": idea("IDEA-001"),
    });
    applyClarifications(ctx, "IDEA-001", [
      { question: "open-questions", option: "open-question", text: "Who is the sponsor?" },
    ]);
    expect(extractSection(getItem(ctx, "IDEA-001").body, "Open questions")).toContain(
      "Who is the sponsor?",
    );
  });

  it("appends Clarifications on a story", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001"),
    });
    applyClarifications(ctx, "US-001", [
      { question: "business-rules", option: "open-question", text: "Is rounding defined?" },
    ]);
    expect(extractSection(getItem(ctx, "US-001").body, "Clarifications")).toContain(
      "Is rounding defined?",
    );
  });
});

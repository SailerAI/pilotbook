import { describe, expect, it } from "vitest";
import { dumpDefaultConfig } from "../src/core/config.ts";
import { deriveLevel, profileOf } from "../src/ops/profile.ts";
import { adr, epic, makeProject, rule, task } from "./helpers.ts";

describe("deriveLevel", () => {
  it("is greenfield for an empty graph", () => {
    expect(
      deriveLevel({
        total: 0,
        doneTasks: 0,
        inFlight: 0,
        acceptedAdrs: 0,
        activeBrs: 0,
        checksConfigured: false,
      }),
    ).toBe("greenfield");
  });

  it("is mature when checks, ADRs, BRs, and done work exist", () => {
    expect(
      deriveLevel({
        total: 20,
        doneTasks: 4,
        inFlight: 1,
        acceptedAdrs: 2,
        activeBrs: 1,
        checksConfigured: true,
      }),
    ).toBe("mature");
  });
});

describe("profileOf", () => {
  it("US-044 derives level and never writes files", () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
      "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "", {
        status: "done",
        story: undefined,
        estimate: 1,
        priority: "P2",
      }),
      "docs/adr/ADR-0001-d.md": adr("ADR-0001"),
      "docs/business-rules/BR-001-r.md": rule("BR-001"),
      "pilotbook.config.yml": dumpDefaultConfig().replace(
        "commands: []",
        'commands: ["pnpm test"]',
      ),
    });
    const before = ctx.fs.readFile("/project/docs/adr/ADR-0001-d.md");
    const profile = profileOf(ctx);
    expect(profile.knowledge.acceptedAdrs).toBe(1);
    expect(profile.knowledge.activeBrs).toBe(1);
    expect(profile.checks.configured).toBe(true);
    expect(profile.calibration.length).toBeGreaterThan(0);
    expect(profile.git).toBeNull();
    expect(ctx.fs.readFile("/project/docs/adr/ADR-0001-d.md")).toBe(before);
    expect(["shaping", "operating", "mature"]).toContain(profile.level);
  });
});

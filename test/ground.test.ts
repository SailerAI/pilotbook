import { describe, expect, it } from "vitest";
import { dumpDefaultConfig } from "../src/core/config.ts";
import { groundDemand } from "../src/ops/ground.ts";
import { epic, makeProject, story } from "./helpers.ts";

describe("groundDemand", () => {
  it("maps a demand onto codeMap keys and still ranks graph items when unmapped", () => {
    const mapped = makeProject({
      "pilotbook.config.yml": dumpDefaultConfig().replace(
        "code_map: {}",
        "code_map:\n  backend: [src]\n  frontend: [ui]\n",
      ),
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Agent skills" }),
      "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", {
        title: "Install backend skills",
      }),
    });
    const hit = groundDemand(mapped, "backend skills");
    expect(hit.areas.some((a) => a.key === "backend")).toBe(true);
    expect(hit.unmapped).toBe(false);
    expect(hit.items.some((i) => i.id === "US-001")).toBe(true);

    const empty = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Agent skills" }),
    });
    const miss = groundDemand(empty, "backend skills");
    expect(miss.areas).toEqual([]);
    expect(miss.unmapped).toBe(true);
    expect(miss.items.length).toBeGreaterThan(0);
  });
});

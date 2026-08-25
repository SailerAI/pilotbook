import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SHIPPED_SKILLS } from "../src/ops/init.ts";
import { AGENT_ROUTER, instructionsOverview, skillOf } from "../src/ops/instructions.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("skill drift", () => {
  it("keeps Cursor and Claude copies byte-identical to skills/", () => {
    for (const name of SHIPPED_SKILLS) {
      const canonical = readFileSync(path.join(root, "skills", `${name}.md`), "utf8");
      const cursor = readFileSync(path.join(root, ".cursor", "skills", name, "SKILL.md"), "utf8");
      const claude = readFileSync(
        path.join(root, ".claude", "skills", `pilotbook-${name}.md`),
        "utf8",
      );
      expect(cursor, `.cursor/skills/${name}/SKILL.md`).toBe(canonical);
      expect(claude, `.claude/skills/pilotbook-${name}.md`).toBe(canonical);
    }
  });
});

describe("instructionsOverview", () => {
  it("US-048 returns the router plus skills", () => {
    const overview = instructionsOverview();
    expect(overview.router).toEqual(AGENT_ROUTER);
    expect(overview.router.explore[0]).toMatch(/discover/i);
    expect(overview.router.ship[0]).toMatch(/implement/i);
    expect(overview.skills.map((s) => s.name)).toEqual([...SHIPPED_SKILLS]);
  });
});

describe("skill protocols", () => {
  it("US-047 core skills calibrate, interview, research, and hand off", () => {
    for (const name of ["discover", "shape", "architect", "implement"] as const) {
      const skill = skillOf(name);
      expect(skill.body).toMatch(/## Calibrate/);
      expect(skill.body).toMatch(/pb profile/);
      expect(skill.body).toMatch(/## Do not/);
    }
    expect(skillOf("discover").body).toMatch(/pb similar/);
    expect(skillOf("discover").body).toMatch(/pb ground/);
    expect(skillOf("architect").body).toMatch(/pb ground/);
    expect(skillOf("shape").body).toMatch(/pb similar/);
  });
});

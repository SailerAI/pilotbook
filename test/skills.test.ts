import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MemoryFileSystem } from "../src/core/memory-fs.ts";
import { initProject, renderSlashCommand, SHIPPED_SKILLS } from "../src/ops/init.ts";
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

  it("US-073: keeps Cursor and Claude commands byte-identical to pb skill <name>", () => {
    for (const name of SHIPPED_SKILLS) {
      const canonical = renderSlashCommand(name);
      const cursor = readFileSync(path.join(root, ".cursor", "commands", `${name}.md`), "utf8");
      const claude = readFileSync(
        path.join(root, ".claude", "commands", `pilotbook-${name}.md`),
        "utf8",
      );
      expect(cursor, `.cursor/commands/${name}.md`).toBe(canonical);
      expect(claude, `.claude/commands/pilotbook-${name}.md`).toBe(canonical);
    }
  });

  it("US-070: pb init writes byte-identical skill and command copies into a fresh repo", () => {
    const fs = new MemoryFileSystem("/fresh");
    initProject("/fresh", { ai: true }, fs);
    for (const name of SHIPPED_SKILLS) {
      const canonical = readFileSync(path.join(root, "skills", `${name}.md`), "utf8");
      const cursor = fs.readFile(`/fresh/.cursor/skills/${name}/SKILL.md`);
      const claude = fs.readFile(`/fresh/.claude/skills/pilotbook-${name}.md`);
      expect(cursor, `.cursor/skills/${name}/SKILL.md`).toBe(canonical);
      expect(claude, `.claude/skills/pilotbook-${name}.md`).toBe(canonical);

      const canonicalCommand = renderSlashCommand(name);
      const cursorCommand = fs.readFile(`/fresh/.cursor/commands/${name}.md`);
      const claudeCommand = fs.readFile(`/fresh/.claude/commands/pilotbook-${name}.md`);
      expect(cursorCommand, `.cursor/commands/${name}.md`).toBe(canonicalCommand);
      expect(claudeCommand, `.claude/commands/pilotbook-${name}.md`).toBe(canonicalCommand);
    }
    const agentsMd = fs.readFile("/fresh/AGENTS.md");
    expect(agentsMd).toContain("pb instructions overview");
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

describe("US-072: fetched content is data, not instructions", () => {
  // Skills that fetch from outside this repository (the open web, a Notion page). Every one of
  // them must state the safety principle in its own body — the check runs in both directions:
  // a skill added here with no matching statement fails by name, same spirit as coverageGaps.
  const FETCHING_SKILLS = ["discover", "interop"] as const;
  const SAFETY_STATEMENT = /data, never instructions|is fetched content, not instructions/i;
  const NO_PROTOCOL_CHANGE = /MUST NOT change (this )?protocol|never a directive that changes/i;

  it("every fetching skill states retrieved content cannot redirect the agent", () => {
    for (const name of FETCHING_SKILLS) {
      const body = skillOf(name).body;
      expect(body, `${name}.md is missing the fetched-content-is-data statement`).toMatch(
        SAFETY_STATEMENT,
      );
      expect(body, `${name}.md never says fetched content can't change the protocol`).toMatch(
        NO_PROTOCOL_CHANGE,
      );
    }
  });

  it("a non-fetching skill is not required to carry the statement", () => {
    // groom, prioritize, architect, implement, shape never fetch outside the repo — sanity check
    // that the assertion above is discriminating, not vacuously true of every skill body.
    for (const name of ["groom", "prioritize", "implement"] as const) {
      expect(skillOf(name).body).not.toMatch(SAFETY_STATEMENT);
    }
  });
});

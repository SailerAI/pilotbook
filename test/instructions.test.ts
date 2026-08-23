import { describe, expect, it } from "vitest";
import { PilotbookError } from "../src/ops/context.ts";
import { SHIPPED_SKILLS } from "../src/ops/init.ts";
import { listSkills, skillOf } from "../src/ops/instructions.ts";

describe("listSkills", () => {
  it("includes every shipped skill with a one-line description", () => {
    const skills = listSkills();
    expect(skills.map((s) => s.name)).toEqual([...SHIPPED_SKILLS]);
    for (const skill of skills) {
      expect(skill.description.length, skill.name).toBeGreaterThan(0);
    }
  });
});

describe("skillOf", () => {
  it("returns implement frontmatter and body", () => {
    const skill = skillOf("implement");
    expect(skill.name).toBe("implement");
    expect(skill.commands).toEqual(expect.arrayContaining(["pb next", "pb brief"]));
    expect(skill.writes.length).toBeGreaterThan(0);
    expect(skill.done.length).toBeGreaterThan(0);
    expect(skill.body.trimStart().startsWith("#")).toBe(true);
    expect(skill.body).not.toMatch(/^---/);
  });

  it("rejects an unknown name", () => {
    expect(() => skillOf("marketplace")).toThrow(PilotbookError);
    try {
      skillOf("marketplace");
    } catch (err) {
      expect(err).toBeInstanceOf(PilotbookError);
      expect((err as PilotbookError).status).toBe(404);
    }
  });
});

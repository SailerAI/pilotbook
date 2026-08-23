import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "../core/frontmatter.ts";
import { PilotbookError } from "./context.ts";
import { SHIPPED_SKILLS } from "./init.ts";
import { bundledSkills } from "./items.ts";

export interface SkillSummary {
  name: string;
  description: string;
}

export interface SkillDoc {
  name: string;
  description: string;
  commands: string[];
  writes: string[];
  done: string;
  body: string;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function readSkill(name: string): SkillDoc {
  const file = path.join(bundledSkills(), `${name}.md`);
  if (!fs.existsSync(file)) {
    throw new PilotbookError(`unknown skill: ${name}`, "not-found", 404, "pb instructions");
  }
  const parsed = parseFrontmatter(fs.readFileSync(file, "utf8"), file);
  return {
    name: String(parsed.data.name ?? name),
    description: String(parsed.data.description ?? ""),
    commands: asStringList(parsed.data.commands),
    writes: asStringList(parsed.data.writes),
    done: String(parsed.data.done ?? ""),
    body: parsed.body,
  };
}

export function listSkills(): SkillSummary[] {
  return SHIPPED_SKILLS.map((name) => {
    const skill = readSkill(name);
    return { name: skill.name || name, description: skill.description };
  });
}

export function skillOf(name: string): SkillDoc {
  const normalized = name.trim().toLowerCase();
  if (!(SHIPPED_SKILLS as readonly string[]).includes(normalized)) {
    throw new PilotbookError(`unknown skill: ${name}`, "not-found", 404, "pb instructions");
  }
  return readSkill(normalized);
}

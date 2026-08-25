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

export interface AgentRouter {
  explore: string[];
  ship: string[];
}

/** Single explore/ship router. Init files must point here instead of inlining a third copy. */
export const AGENT_ROUTER: AgentRouter = {
  explore: [
    "Vague demand, new feature, idea, or epic → follow **discover**, then **shape**. Do not jump to pb next.",
    "Load `pb skill discover`, then `pb skill shape`.",
  ],
  ship: [
    "Existing work or `pb next` → follow **implement**: next → brief → verify → lint.",
    "Load `pb skill implement`.",
  ],
};

export interface InstructionsOverview {
  router: AgentRouter;
  skills: SkillSummary[];
}

export function instructionsOverview(): InstructionsOverview {
  return { router: AGENT_ROUTER, skills: listSkills() };
}

export function skillOf(name: string): SkillDoc {
  const normalized = name.trim().toLowerCase();
  if (!(SHIPPED_SKILLS as readonly string[]).includes(normalized)) {
    throw new PilotbookError(`unknown skill: ${name}`, "not-found", 404, "pb instructions");
  }
  return readSkill(normalized);
}

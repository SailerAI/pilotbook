import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dumpDefaultConfig } from "../src/core/config.ts";
import { MemoryFileSystem } from "../src/core/memory-fs.ts";
import { type OpContext, withProject } from "../src/ops/context.ts";

const TEMPLATES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../templates");

export function loadTemplate(name: string): string {
  return readFileSync(path.join(TEMPLATES, name), "utf8");
}

export function fm(fields: Record<string, unknown>, body: string): string {
  const lines = ["---"];
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.join(", ")}]`);
    else if (typeof v === "object" && v !== null) {
      const inner = Object.entries(v as Record<string, unknown>)
        .map(([ik, iv]) => `${ik}: ${Array.isArray(iv) ? `[${iv.join(", ")}]` : iv}`)
        .join(", ");
      lines.push(`${k}: { ${inner} }`);
    } else lines.push(`${k}: ${v}`);
  }
  lines.push("---", "", body.trimEnd(), "");
  return lines.join("\n");
}

export function makeProject(files: Record<string, string> = {}): OpContext {
  const fs = new MemoryFileSystem("/project");
  const seeded: Record<string, string> = {
    "pilotbook.config.yml": dumpDefaultConfig(),
    ".git/HEAD": "ref: refs/heads/main",
    "templates/epic.md": loadTemplate("epic.md"),
    "templates/story.md": loadTemplate("story.md"),
    "templates/task.md": loadTemplate("task.md"),
    "templates/adr.md": loadTemplate("adr.md"),
    "templates/business-rule.md": loadTemplate("business-rule.md"),
    "templates/idea.md": loadTemplate("idea.md"),
    ...files,
  };
  fs.seed(seeded);
  return withProject("/project", fs);
}

export const DATES = { created: "2026-08-23", updated: "2026-08-23" };

export function epic(
  id: string,
  extra: Record<string, unknown> = {},
  body = "## Outcome\n\nDone when ready.",
): string {
  return fm(
    {
      id,
      title: extra.title ?? id,
      type: "epic",
      status: extra.status ?? "todo",
      priority: extra.priority ?? "P1",
      estimate: extra.estimate ?? 5,
      phase: extra.phase ?? 1,
      owner: "unassigned",
      tags: extra.tags ?? [],
      depends_on: extra.depends_on ?? [],
      goal: extra.goal ?? "Ship it",
      ...DATES,
    },
    body,
  );
}

export function story(
  id: string,
  epicId: string,
  extra: Record<string, unknown> = {},
  body?: string,
): string {
  return fm(
    {
      id,
      title: extra.title ?? id,
      type: "story",
      epic: epicId,
      status: extra.status ?? "todo",
      priority: extra.priority ?? "P1",
      estimate: extra.estimate ?? 3,
      phase: extra.phase ?? 1,
      owner: "unassigned",
      tags: extra.tags ?? [],
      depends_on: extra.depends_on ?? [],
      business_rules: extra.business_rules ?? [],
      adrs: extra.adrs ?? [],
      ...DATES,
    },
    body ?? "## Story\n\nAs a user.\n\n## Acceptance criteria\n\n- [ ] works\n",
  );
}

export function task(
  id: string,
  storyId: string,
  extra: Record<string, unknown> = {},
  body?: string,
): string {
  return fm(
    {
      id,
      title: extra.title ?? id,
      type: "task",
      story: storyId,
      status: extra.status ?? "todo",
      priority: extra.priority ?? "P1",
      estimate: extra.estimate ?? 2,
      phase: extra.phase ?? 1,
      owner: "unassigned",
      area: extra.area ?? "backend",
      tags: extra.tags ?? [],
      depends_on: extra.depends_on ?? [],
      ...DATES,
      ...(extra.verified ? { verified: extra.verified } : {}),
    },
    body ?? "## Scope\n\nDo the thing.\n",
  );
}

export function adr(id: string, extra: Record<string, unknown> = {}, body?: string): string {
  return fm(
    {
      id,
      title: extra.title ?? id,
      type: "adr",
      status: extra.status ?? "accepted",
      date: "2026-08-23",
      deciders: ["x"],
      tags: [],
      supersedes: extra.supersedes ?? [],
      superseded_by: extra.superseded_by ?? [],
      ...DATES,
    },
    body ?? "## Context\n\nWe had to choose.\n\n## Decision\n\nWe chose A.\n",
  );
}

export function rule(id: string, extra: Record<string, unknown> = {}, body?: string): string {
  return fm(
    {
      id,
      title: extra.title ?? id,
      type: "business-rule",
      status: extra.status ?? "active",
      domain: "ledger",
      version: 1,
      related: extra.related ?? [],
      tags: [],
      ...DATES,
    },
    body ?? "## Rule\n\nMUST keep money as strings.\n",
  );
}

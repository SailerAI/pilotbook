import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dumpDefaultConfig } from "../src/core/config.ts";
import { bodyHash } from "../src/core/hash.ts";
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
      related: extra.related ?? [],
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

export function hashedBody(body: string): string {
  return `${body.trimEnd()}\n`;
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
      ...(storyId ? { story: storyId } : {}),
      status: extra.status ?? "todo",
      priority: extra.priority ?? "P1",
      estimate: extra.estimate ?? 2,
      phase: extra.phase ?? 1,
      owner: "unassigned",
      area: extra.area ?? "backend",
      tags: extra.tags ?? [],
      depends_on: extra.depends_on ?? [],
      ...(extra.business_rules ? { business_rules: extra.business_rules } : {}),
      ...(extra.adrs ? { adrs: extra.adrs } : {}),
      ...(extra.covers ? { covers: extra.covers } : {}),
      ...DATES,
      ...(extra.verified ? { verified: extra.verified } : {}),
    },
    body ?? "## Scope\n\nDo the thing.\n",
  );
}

export function idea(id: string, extra: Record<string, unknown> = {}, body?: string): string {
  return fm(
    {
      id,
      title: extra.title ?? id,
      type: "idea",
      status: extra.status ?? "raw",
      impact: extra.impact ?? "medium",
      effort: extra.effort ?? "medium",
      promoted_to: extra.promoted_to ?? [],
      related: extra.related ?? [],
      tags: extra.tags ?? [],
      ...DATES,
    },
    body ??
      "## Why\n\nWho benefits and why this is worth capturing.\n\n## Jobs to be done\n\nThe job the user is hiring this for.\n\n## Personas\n\nWho this is for, in one or two named roles.\n\n## Sketch\n\nA rough shape of the solution. Not a spec.\n\n## Evidence\n\nAt least one URL or internal ID (ADR-, BR-, US-).\n\n## Open questions\n\n- Question 1\n\n## Why not now\n\nWhat would have to be true before this is promoted to an epic or story.\n",
  );
}

export function adr(id: string, extra: Record<string, unknown> = {}, body?: string): string {
  const bodyText = body ?? "## Context\n\nWe had to choose.\n\n## Decision\n\nWe chose A.\n";
  return fm(
    {
      id,
      title: extra.title ?? id,
      type: "adr",
      status: extra.status ?? "accepted",
      version: extra.version ?? 1,
      date: "2026-08-23",
      deciders: ["x"],
      tags: [],
      supersedes: extra.supersedes ?? [],
      superseded_by: extra.superseded_by ?? [],
      content_hash: extra.content_hash ?? bodyHash(hashedBody(bodyText)),
      ...DATES,
      ...(extra.amended ? { amended: extra.amended } : {}),
    },
    bodyText,
  );
}

export function rule(id: string, extra: Record<string, unknown> = {}, body?: string): string {
  const bodyText = body ?? "## Rule\n\nMUST keep money as strings.\n";
  return fm(
    {
      id,
      title: extra.title ?? id,
      type: "business-rule",
      status: extra.status ?? "active",
      domain: "ledger",
      version: extra.version ?? 1,
      content_hash: extra.content_hash ?? bodyHash(hashedBody(bodyText)),
      related: extra.related ?? [],
      tags: [],
      ...DATES,
      ...(extra.amended ? { amended: extra.amended } : {}),
    },
    bodyText,
  );
}

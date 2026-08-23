import type { OpContext } from "./context.ts";
import { PilotbookError } from "./context.ts";
import { createItem } from "./items.ts";

export interface SeedPlanItem {
  type: string;
  title: string;
  parent?: string;
  area?: string;
  goal?: string;
  body?: string;
  depends_on?: string[];
}

export interface SeedResult {
  dryRun: boolean;
  created: Array<{ type: string; title: string; id?: string }>;
  plan: SeedPlanItem[];
}

interface Heading {
  level: number;
  title: string;
  body: string;
}

function parseHeadings(md: string): Heading[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const headings: Heading[] = [];
  let current: Heading | null = null;
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      if (current) headings.push(current);
      current = { level: m[1]?.length ?? 1, title: (m[2] ?? "").trim(), body: "" };
    } else if (current) {
      current.body += `${line}\n`;
    }
  }
  if (current) headings.push(current);
  return headings;
}

function stripPrefix(title: string, kind: string): string {
  const re = new RegExp(`^${kind}\\s*[:—-]\\s*`, "i");
  return title.replace(re, "").trim() || title;
}

export function planFromBrief(markdown: string): SeedPlanItem[] {
  const headings = parseHeadings(markdown);
  const plan: SeedPlanItem[] = [];
  let epic: string | undefined;
  let story: string | undefined;
  for (const h of headings) {
    const t = h.title;
    if (/^epic\b/i.test(t) || h.level === 1) {
      const title = stripPrefix(t, "epic");
      epic = title;
      story = undefined;
      const goalLine = h.body.split("\n").find((l) => /^goal\s*:/i.test(l));
      plan.push({
        type: "epic",
        title,
        goal: goalLine ? goalLine.replace(/^goal\s*:\s*/i, "").trim() : undefined,
        body: `## Outcome\n\n${h.body.trim()}\n`,
      });
      continue;
    }
    if (/^story\b/i.test(t) || h.level === 2) {
      const title = stripPrefix(t, "story");
      story = title;
      plan.push({
        type: "story",
        title,
        parent: epic,
        body: `## Story\n\n${h.body.trim()}\n\n## Acceptance criteria\n\n- [ ] Given …, when …, then …\n`,
      });
      continue;
    }
    if (/^task\b/i.test(t) || h.level === 3) {
      const title = stripPrefix(t, "task");
      const areaLine = h.body.split("\n").find((l) => /^area\s*:/i.test(l));
      const depLine = h.body.split("\n").find((l) => /^depends_on\s*:/i.test(l));
      const depends_on = depLine
        ? depLine
            .replace(/^depends_on\s*:\s*/i, "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      plan.push({
        type: "task",
        title,
        parent: story,
        area: areaLine ? areaLine.replace(/^area\s*:\s*/i, "").trim() : "backend",
        depends_on,
        body: `## Scope\n\n${h.body.trim()}\n`,
      });
    }
  }
  if (!plan.length)
    throw new PilotbookError(
      "brief produced no epics/stories/tasks — use '# Epic: …', '## Story: …', '### Task: …'",
    );
  return plan;
}

export function seedFromBrief(
  ctx: OpContext,
  markdown: string,
  opts: { dryRun?: boolean; storyId?: string; epicId?: string; chainDependsOn?: boolean } = {},
): SeedResult {
  const plan = planFromBrief(markdown);
  if (opts.dryRun) {
    return { dryRun: true, created: plan.map((p) => ({ type: p.type, title: p.title })), plan };
  }
  const created: SeedResult["created"] = [];
  const epicIds = new Map<string, string>();
  const storyIds = new Map<string, string>();
  let lastTaskId: string | undefined;
  for (const step of plan) {
    if (step.type === "epic") {
      const item = createItem(ctx, {
        type: "epic",
        title: step.title,
        goal: step.goal,
        body: step.body,
      });
      epicIds.set(step.title, item.id);
      created.push({ type: "epic", title: step.title, id: item.id });
    } else if (step.type === "story") {
      const epic = step.parent ? epicIds.get(step.parent) : opts.epicId;
      if (!epic) throw new PilotbookError(`story "${step.title}" has no epic`);
      const item = createItem(ctx, { type: "story", title: step.title, epic, body: step.body });
      storyIds.set(step.title, item.id);
      created.push({ type: "story", title: step.title, id: item.id });
    } else if (step.type === "task") {
      const story = step.parent ? storyIds.get(step.parent) : opts.storyId;
      if (!story) throw new PilotbookError(`task "${step.title}" has no story`);
      const depends_on =
        step.depends_on ?? (opts.chainDependsOn && lastTaskId ? [lastTaskId] : undefined);
      const item = createItem(ctx, {
        type: "task",
        title: step.title,
        story,
        area: step.area,
        ...(depends_on ? { depends_on } : {}),
        body: step.body,
      });
      lastTaskId = item.id;
      created.push({ type: "task", title: step.title, id: item.id });
    }
  }
  return { dryRun: false, created, plan };
}

import { parseChecklist } from "../core/checklist.ts";
import { hostJoin, toPosix } from "../core/config.ts";
import type { FileSystem } from "../core/fs.ts";
import { inboundOf } from "../core/graph.ts";
import { nextId, slugify } from "../core/ids.ts";
import { extractSection } from "../core/markdown.ts";
import type { ParsedItem, PublicItem } from "../core/types.ts";
import { analyzeGraph } from "./analyze.ts";
import { type OpContext, PilotbookError } from "./context.ts";
import { createItem } from "./items.ts";

const CRITERION_KEY = /^([^#\s]+)#(\d+)$/;

export interface ConvergePlanTask {
  type: "task";
  title: string;
  story: string;
  covers: string[];
  business_rules: string[];
  adrs: string[];
}

export interface ConvergeResult {
  status: "converged" | "plan";
  dryRun: boolean;
  id: string;
  tasks: ConvergePlanTask[];
  created: PublicItem[];
}

interface PlannedTask extends ConvergePlanTask {
  rel: string;
  abs: string;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function isUnder(dir: string, file: string): boolean {
  const d = toPosix(dir).replace(/\/$/, "");
  const f = toPosix(file);
  return f === d || f.startsWith(`${d}/`);
}

function storiesInScope(ctx: OpContext, id: string): ParsedItem[] {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  if (item.type === "story") return [item];
  if (item.type === "epic") {
    return inboundOf(ctx.project.index, id, ["epic"])
      .filter((child) => child.type === "story")
      .sort((a, b) => a.data.id.localeCompare(b.data.id));
  }
  throw new PilotbookError(`converge requires a story or epic, got ${item.type}`, "invalid-type");
}

function criterionText(story: ParsedItem, index: number): string {
  const criteria = parseChecklist(extractSection(story.body, "Acceptance criteria"));
  return criteria.find((c) => c.index === index)?.text ?? "";
}

function planTasks(ctx: OpContext, id: string): PlannedTask[] {
  const stories = storiesInScope(ctx, id);
  const storyIds = new Set(stories.map((s) => s.data.id));
  const storyById = new Map(stories.map((s) => [s.data.id, s]));
  const report = analyzeGraph(ctx);
  const gaps = report.coverage.filter((row) => {
    if (row.hasTask) return false;
    const match = CRITERION_KEY.exec(row.key);
    return Boolean(match && storyIds.has(match[1]!));
  });

  const cfg = ctx.project.config.types.task;
  if (!cfg) throw new PilotbookError("unknown type: task");
  const taskDirRel = toPosix(`${ctx.project.config.root}/${cfg.dir}`);
  const taskDirAbs = hostJoin(ctx.project.projectRoot, taskDirRel);
  const simulated = [...ctx.project.index.items];
  const planned: PlannedTask[] = [];

  for (const row of gaps) {
    const match = CRITERION_KEY.exec(row.key);
    if (!match) continue;
    const storyId = match[1]!;
    const story = storyById.get(storyId);
    if (!story) continue;
    const text = criterionText(story, Number(match[2]));
    const title = text || `Cover ${row.key}`;
    const next = nextId("task", cfg, simulated);
    const slug = slugify(title) || "untitled";
    const rel = toPosix(`${ctx.project.config.root}/${cfg.dir}/${next}-${slug}.md`);
    const abs = hostJoin(ctx.project.projectRoot, rel);
    if (ctx.fs.exists(abs)) {
      throw new PilotbookError(`converge refuses to overwrite ${rel}`, "unsafe-write");
    }
    if (!isUnder(taskDirAbs, abs)) {
      throw new PilotbookError(`converge refuses to write ${rel}`, "unsafe-write");
    }
    planned.push({
      type: "task",
      title,
      story: storyId,
      covers: [row.key],
      business_rules: asStringList(story.data.business_rules),
      adrs: asStringList(story.data.adrs),
      rel,
      abs,
    });
    simulated.push({ type: "task", data: { id: next } } as ParsedItem);
  }
  return planned;
}

function withTaskOnlyWrites(ctx: OpContext, allowedAbs: Set<string>, fn: () => void): void {
  const inner = ctx.fs;
  const allowed = new Set([...allowedAbs].map((p) => toPosix(p)));
  const guard: FileSystem = {
    cwd: () => inner.cwd(),
    readFile: (p) => inner.readFile(p),
    exists: (p) => inner.exists(p),
    mkdirp: (p) => inner.mkdirp(p),
    readdir: (p) => inner.readdir(p),
    stat: (p) => inner.stat(p),
    writeFile: (p, c) => {
      if (!allowed.has(toPosix(p))) {
        throw new PilotbookError(`converge refuses to write ${p}`, "unsafe-write");
      }
      inner.writeFile(p, c);
    },
    writeFileAtomic: (p, c) => {
      if (!allowed.has(toPosix(p))) {
        throw new PilotbookError(`converge refuses to write ${p}`, "unsafe-write");
      }
      inner.writeFileAtomic(p, c);
    },
    unlink: (p) => {
      throw new PilotbookError(`converge refuses to delete ${p}`, "unsafe-write");
    },
  };
  ctx.fs = guard;
  try {
    fn();
  } finally {
    ctx.fs = inner;
  }
}

function toPlanTask(planned: PlannedTask): ConvergePlanTask {
  return {
    type: planned.type,
    title: planned.title,
    story: planned.story,
    covers: planned.covers,
    business_rules: planned.business_rules,
    adrs: planned.adrs,
  };
}

export function convergeItem(
  ctx: OpContext,
  id: string,
  opts: { dryRun?: boolean } = {},
): ConvergeResult {
  const dryRun = Boolean(opts.dryRun);
  const planned = planTasks(ctx, id);
  const tasks = planned.map(toPlanTask);

  if (planned.length === 0) {
    return { status: "converged", dryRun, id, tasks: [], created: [] };
  }
  if (dryRun) {
    return { status: "plan", dryRun: true, id, tasks, created: [] };
  }

  const created: PublicItem[] = [];
  withTaskOnlyWrites(ctx, new Set(planned.map((p) => p.abs)), () => {
    for (const step of planned) {
      created.push(
        createItem(
          ctx,
          {
            type: "task",
            title: step.title,
            story: step.story,
            covers: step.covers,
            ...(step.business_rules.length ? { business_rules: step.business_rules } : {}),
            ...(step.adrs.length ? { adrs: step.adrs } : {}),
            body: `## Scope\n\nCover ${step.covers[0]} on ${step.story}.\n\n${step.title}\n\n## Steps\n\n- [ ] Close this gap\n\n## Verification\n\nA covering task exists for ${step.covers[0]}.\n`,
          },
          { skipBoard: true },
        ),
      );
    }
  });

  return { status: "converged", dryRun: false, id, tasks, created };
}

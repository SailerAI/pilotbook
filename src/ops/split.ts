import { parseChecklist } from "../core/checklist.ts";
import type { ParsedItem, PilotbookConfig } from "../core/types.ts";
import { AREAS } from "../core/types.ts";
import { type OpContext, PilotbookError } from "./context.ts";
import { createItem, updateItem } from "./items.ts";
import { seedFromBrief } from "./seed.ts";

export interface ComplexityScore {
  criterion_count: number;
  linked_rule_count: number;
  distinct_code_map_areas: number;
  score: number;
  recommended_count: number;
  already_small: boolean;
}

export interface SplitChild {
  type: "story" | "task";
  title: string;
  area?: string;
  depends_on?: string[];
}

export interface SplitPlan {
  id: string;
  type: string;
  dryRun: boolean;
  recommended_count: number;
  score: ComplexityScore;
  children: SplitChild[];
}

export interface SplitResult extends SplitPlan {
  created: Array<{ type: string; title: string; id?: string }>;
  storyId?: string;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

function distinctCodeMapAreas(item: ParsedItem, config: PilotbookConfig): number {
  const keys = Object.keys(config.codeMap);
  const body = item.body ?? "";
  const fromBody = keys.filter((k) => (config.codeMap[k] ?? []).some((p) => body.includes(p)));
  if (fromBody.length) return fromBody.length;
  const tags = asList(item.data.tags);
  const fromTags = keys.filter((k) => tags.includes(k));
  if (fromTags.length) return fromTags.length;
  return 1;
}

export function scoreComplexity(item: ParsedItem, config: PilotbookConfig): ComplexityScore {
  const criterion_count = parseChecklist(item.body).length;
  const linked_rule_count = asList(item.data.business_rules).length + asList(item.data.adrs).length;
  const distinct_code_map_areas = distinctCodeMapAreas(item, config);
  const area = item.data.area;
  const already_small =
    item.type === "task" && typeof area === "string" && area.length > 0 && criterion_count <= 1;
  const score = criterion_count + linked_rule_count + distinct_code_map_areas;
  const recommended_count = Math.max(2, criterion_count, distinct_code_map_areas);
  return {
    criterion_count,
    linked_rule_count,
    distinct_code_map_areas,
    score,
    recommended_count,
    already_small,
  };
}

function placeholderChildren(item: ParsedItem, score: ComplexityScore): SplitChild[] {
  const n = score.recommended_count;
  const title = String(item.data.title ?? item.data.id);
  if (item.type === "epic") {
    return Array.from({ length: n }, (_, i) => ({
      type: "story" as const,
      title: `${title} (${i + 1}/${n})`,
    }));
  }
  const areas = AREAS.length ? [...AREAS] : ["backend"];
  return Array.from({ length: n }, (_, i) => ({
    type: "task" as const,
    title: `${title} (${i + 1}/${n})`,
    area: areas[i % areas.length],
    depends_on: i > 0 ? ["(previous sibling)"] : [],
  }));
}

function renderSeedMarkdown(children: SplitChild[]): string {
  return children
    .map((child) => {
      if (child.type === "story") return `## Story: ${child.title}\n`;
      const area = child.area ?? "backend";
      return `### Task: ${child.title}\narea: ${area}\n`;
    })
    .join("\n");
}

function refuseSmall(id: string): never {
  throw new PilotbookError(
    `${id} is already small`,
    "already-small",
    400,
    "do not split; the item already has an area and a single criterion",
  );
}

export function splitItem(
  ctx: OpContext,
  id: string,
  opts: { dryRun?: boolean; epic?: string } = {},
): SplitResult {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  if (item.type !== "epic" && item.type !== "story" && item.type !== "task") {
    throw new PilotbookError(`${id} cannot be split`, "wrong-type", 400, "pb split <EPIC|US|TASK>");
  }

  const score = scoreComplexity(item, ctx.project.config);
  if (score.already_small || score.recommended_count <= 1) refuseSmall(id);

  const parentlessTask = item.type === "task" && !item.data.story;
  if (parentlessTask && !opts.epic) {
    throw new PilotbookError(
      `splitting a parentless task requires --epic`,
      "missing-epic",
      400,
      `pb split ${id} --epic EPIC-NNN`,
    );
  }

  const children = placeholderChildren(item, score);
  const plan: SplitPlan = {
    id,
    type: item.type,
    dryRun: Boolean(opts.dryRun),
    recommended_count: score.recommended_count,
    score,
    children,
  };

  if (opts.dryRun) {
    return { ...plan, created: children.map((c) => ({ type: c.type, title: c.title })) };
  }

  if (parentlessTask) {
    const epic = String(opts.epic);
    const story = createItem(ctx, {
      type: "story",
      title: String(item.data.title ?? id),
      epic,
    });
    updateItem(ctx, id, { data: { story: story.id } });
    const remaining = children.slice(1);
    const markdown = renderSeedMarkdown(remaining);
    const seeded = remaining.length
      ? seedFromBrief(ctx, markdown, { storyId: story.id, chainDependsOn: true })
      : { created: [] as Array<{ type: string; title: string; id?: string }> };
    return {
      ...plan,
      dryRun: false,
      storyId: story.id,
      created: [
        { type: "story", title: String(story.data.title), id: story.id },
        ...seeded.created,
      ],
    };
  }

  if (item.type === "epic") {
    const markdown = renderSeedMarkdown(children);
    const seeded = seedFromBrief(ctx, markdown, { epicId: id });
    return { ...plan, dryRun: false, created: seeded.created };
  }

  const markdown = renderSeedMarkdown(children);
  const seeded = seedFromBrief(ctx, markdown, { storyId: id, chainDependsOn: true });
  return { ...plan, dryRun: false, created: seeded.created };
}

import { type BriefResult, compileBrief, renderBriefMarkdown } from "../core/brief.ts";
import { formatDiagnostic, formatGithub, type LintResult, lintGraph } from "../core/lint.ts";
import { type ParsedItem, PRIORITIES, WORK_TYPES } from "../core/types.ts";
import { type OpContext, PilotbookError } from "./context.ts";
import { writeBoard } from "./items.ts";

export function lint(ctx: OpContext): LintResult {
  return lintGraph(ctx.project.index, ctx.project.config, ctx.project.peers);
}

export function lintText(
  ctx: OpContext,
  format: "text" | "github" = "text",
): { text: string; ok: boolean; result: LintResult } {
  const result = lint(ctx);
  if (format === "github") {
    return {
      text: formatGithub([...result.errors, ...result.warnings]),
      ok: result.errors.length === 0,
      result,
    };
  }
  const lines = [
    ...result.warnings.map((d) => `warn: ${formatDiagnostic(d)}`),
    ...result.errors.map((d) => `error: ${formatDiagnostic(d)}`),
    result.errors.length
      ? `lint failed: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`
      : `lint ok: ${result.count} items, ${result.warnings.length} warning(s)`,
  ];
  return { text: `${lines.join("\n")}\n`, ok: result.errors.length === 0, result };
}

function isResolved(status: unknown): boolean {
  return status === "done" || status === "cancelled";
}

function isUnblocked(item: ParsedItem, byId: Map<string, ParsedItem>): boolean {
  if (!["todo", "backlog"].includes(String(item.data.status))) return false;
  const deps = Array.isArray(item.data.depends_on) ? item.data.depends_on.map(String) : [];
  for (const ref of deps) {
    if (ref.includes("#")) continue;
    const target = byId.get(ref);
    if (!target || !isResolved(target.data.status)) return false;
  }
  return true;
}

function priorityRank(p: unknown): number {
  const i = PRIORITIES.indexOf(String(p) as (typeof PRIORITIES)[number]);
  return i === -1 ? 99 : i;
}

function sortReady(a: ParsedItem, b: ParsedItem): number {
  const pa = typeof a.data.phase === "number" ? a.data.phase : 99;
  const pb = typeof b.data.phase === "number" ? b.data.phase : 99;
  return (
    pa - pb ||
    priorityRank(a.data.priority) - priorityRank(b.data.priority) ||
    (typeof a.data.estimate === "number" ? a.data.estimate : 99) -
      (typeof b.data.estimate === "number" ? b.data.estimate : 99) ||
    a.data.id.localeCompare(b.data.id)
  );
}

export interface ReadyItem {
  id: string;
  type: string;
  phase: unknown;
  priority: unknown;
  estimate: unknown;
  status: unknown;
  title: string;
}

export function nextReady(ctx: OpContext): ReadyItem[] {
  const { items, byId } = ctx.project.index;
  return items
    .filter((i) => WORK_TYPES.includes(i.type))
    .filter((i) => isUnblocked(i, byId))
    .sort(sortReady)
    .map((i) => ({
      id: i.data.id,
      type: i.type,
      phase: i.data.phase,
      priority: i.data.priority,
      estimate: i.data.estimate,
      status: i.data.status,
      title: String(i.data.title),
    }));
}

export function briefOf(
  ctx: OpContext,
  id: string,
  opts: { budget?: number; format?: "md" | "json" } = {},
): { brief: BriefResult; text: string } {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  const brief = compileBrief(item, ctx.project.index.items, ctx.project.config, {
    budget: opts.budget,
    peers: ctx.project.peers,
  });
  return { brief, text: renderBriefMarkdown(brief) };
}

export function explain(
  ctx: OpContext,
  id: string,
): {
  id: string;
  status: unknown;
  blockedBy: string[];
  blocks: string[];
  parent?: string;
  children: string[];
  notes: string[];
} {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  const { byId, items } = ctx.project.index;
  const deps = Array.isArray(item.data.depends_on) ? item.data.depends_on.map(String) : [];
  const blockedBy = deps.filter((ref) => {
    if (ref.includes("#")) return true;
    const t = byId.get(ref);
    return !t || !isResolved(t.data.status);
  });
  const blocks = items
    .filter((i) => Array.isArray(i.data.depends_on) && i.data.depends_on.map(String).includes(id))
    .map((i) => i.data.id);
  const parentField = ctx.project.config.types[item.type]?.parent;
  const parent =
    parentField && typeof item.data[parentField] === "string"
      ? String(item.data[parentField])
      : undefined;
  const children = items
    .filter((i) => {
      const pf = ctx.project.config.types[i.type]?.parent;
      return pf && i.data[pf] === id;
    })
    .map((i) => i.data.id);
  const notes: string[] = [];
  if (["todo", "backlog"].includes(String(item.data.status)) && blockedBy.length) {
    notes.push(`Cannot start: waiting on ${blockedBy.join(", ")}.`);
  } else if (["todo", "backlog"].includes(String(item.data.status))) {
    notes.push("Unblocked and ready to start.");
  }
  if (item.data.status === "blocked") notes.push("Marked blocked — say why in the body.");
  return { id, status: item.data.status, blockedBy, blocks, parent, children, notes };
}

export function graphDot(ctx: OpContext): string {
  const { items } = ctx.project.index;
  const lines = [
    "digraph pilotbook {",
    "  rankdir=LR;",
    '  node [shape=box, fontname="Helvetica"];',
  ];
  for (const item of items) {
    const shape = item.type === "adr" || item.type === "business-rule" ? "note" : "box";
    const color =
      item.type === "business-rule" ? "#4cb782" : item.type === "adr" ? "#5e6ad2" : "#8a8f98";
    lines.push(
      `  "${item.data.id}" [label="${item.data.id}\\n${String(item.data.title).slice(0, 40).replaceAll('"', '\\"')}", shape=${shape}, color="${color}"];`,
    );
  }
  for (const item of items) {
    for (const [field, kind] of Object.entries(ctx.project.config.edges)) {
      const values = kind.scalar
        ? typeof item.data[field] === "string" && item.data[field]
          ? [String(item.data[field])]
          : []
        : Array.isArray(item.data[field])
          ? item.data[field].map(String)
          : [];
      for (const ref of values) {
        const label = field === "depends_on" ? "" : ` [label="${field}"]`;
        lines.push(`  "${item.data.id}" -> "${ref.replaceAll('"', "")}"${label};`);
      }
    }
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

export function board(ctx: OpContext): { wrote: string } {
  return { wrote: writeBoard(ctx) };
}

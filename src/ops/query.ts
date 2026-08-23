import { type BriefResult, compileBrief, renderBriefMarkdown } from "../core/brief.ts";
import { splitRemoteId } from "../core/ids.ts";
import { formatDiagnostic, formatGithub, type LintResult, lintGraph } from "../core/lint.ts";
import { type ParsedItem, type PeerItem, PRIORITIES, WORK_TYPES } from "../core/types.ts";
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

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function isResolved(status: unknown): boolean {
  return status === "done" || status === "cancelled";
}

function isRemoteRef(ref: string): boolean {
  return ref.includes("#");
}

export type ItemState = "ready" | "blocked" | "done" | "cancelled";
export type RequireState = ItemState | "missing" | "remote";
export type Ladder = "resume" | "review" | "ready" | "backlog";

const LADDER_RANK: Record<Ladder, number> = {
  resume: 0,
  review: 1,
  ready: 2,
  backlog: 3,
};

/** Computed ready/blocked/done/cancelled. Remote `repo#ID` refs never block. */
export function itemState(item: ParsedItem, byId: Map<string, ParsedItem>): ItemState {
  const status = String(item.data.status ?? "");
  if (status === "done" || status === "cancelled") return status;
  for (const ref of asList(item.data.depends_on)) {
    if (isRemoteRef(ref)) continue;
    const target = byId.get(ref);
    if (!target || !isResolved(target.data.status)) return "blocked";
  }
  return "ready";
}

function requireState(
  ref: string,
  byId: Map<string, ParsedItem>,
  peers: Map<string, PeerItem[]>,
): RequireState {
  if (isRemoteRef(ref)) {
    const { repo, id } = splitRemoteId(ref);
    const peer = repo ? peers.get(repo)?.find((p) => p.id === id) : undefined;
    if (!peer) return "remote";
    if (peer.status === "done" || peer.status === "cancelled") return peer.status;
    return "ready";
  }
  const target = byId.get(ref);
  if (!target) return "missing";
  return itemState(target, byId);
}

export interface RequireRef {
  id: string;
  state: RequireState;
}

export interface UnlockRef {
  id: string;
  state: ItemState;
  title: string;
}

export interface StatusOf {
  id: string;
  type: string;
  title: string;
  status: unknown;
  state: ItemState;
  requires: RequireRef[];
  missingDeps: string[];
  unlocks: UnlockRef[];
}

export function statusOf(ctx: OpContext, id: string): StatusOf {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  const { byId, items } = ctx.project.index;
  const deps = asList(item.data.depends_on);
  const requires: RequireRef[] = deps.map((ref) => ({
    id: ref,
    state: requireState(ref, byId, ctx.project.peers),
  }));
  const missingDeps = deps.filter((ref) => {
    if (isRemoteRef(ref)) return false;
    const target = byId.get(ref);
    return !target || !isResolved(target.data.status);
  });
  const unlocks: UnlockRef[] = items
    .filter((other) => asList(other.data.depends_on).includes(id))
    .map((other) => ({
      id: other.data.id,
      state: itemState(other, byId),
      title: String(other.data.title ?? ""),
    }));
  return {
    id: item.data.id,
    type: item.type,
    title: String(item.data.title ?? ""),
    status: item.data.status,
    state: itemState(item, byId),
    requires,
    missingDeps,
    unlocks,
  };
}

/** Ready work items in topological `depends_on` order; index order breaks ties. */
export function listReady(ctx: OpContext): StatusOf[] {
  const { items, byId } = ctx.project.index;
  const ready = items.filter(
    (i) =>
      WORK_TYPES.includes(i.type) &&
      String(i.data.status) !== "rejected" &&
      itemState(i, byId) === "ready",
  );
  const indexOf = new Map(items.map((item, i) => [item.data.id, i]));
  const readyIds = new Set(ready.map((i) => i.data.id));
  const remaining = new Map<string, Set<string>>();
  for (const item of ready) {
    const deps = asList(item.data.depends_on).filter((r) => !isRemoteRef(r) && readyIds.has(r));
    remaining.set(item.data.id, new Set(deps));
  }
  const ordered: ParsedItem[] = [];
  const pending = [...ready];
  while (pending.length) {
    const candidates = pending.filter((i) => (remaining.get(i.data.id)?.size ?? 0) === 0);
    if (!candidates.length) {
      pending.sort((a, b) => (indexOf.get(a.data.id) ?? 0) - (indexOf.get(b.data.id) ?? 0));
      ordered.push(...pending);
      break;
    }
    candidates.sort((a, b) => (indexOf.get(a.data.id) ?? 0) - (indexOf.get(b.data.id) ?? 0));
    const next = candidates[0]!;
    pending.splice(pending.indexOf(next), 1);
    ordered.push(next);
    for (const deps of remaining.values()) deps.delete(next.data.id);
  }
  return ordered.map((i) => statusOf(ctx, i.data.id));
}

function ladderOf(status: unknown): Ladder | null {
  const s = String(status);
  if (s === "in-progress") return "resume";
  if (s === "review") return "review";
  if (s === "todo" || s === "ready") return "ready";
  if (s === "backlog") return "backlog";
  return null;
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
  ladder: Ladder;
}

export function nextReady(ctx: OpContext): ReadyItem[] {
  const { items, byId } = ctx.project.index;
  return items
    .filter((i) => WORK_TYPES.includes(i.type))
    .filter((i) => String(i.data.status) !== "rejected")
    .filter((i) => itemState(i, byId) === "ready")
    .map((i) => ({ item: i, ladder: ladderOf(i.data.status) }))
    .filter((row): row is { item: ParsedItem; ladder: Ladder } => row.ladder !== null)
    .sort((a, b) => LADDER_RANK[a.ladder] - LADDER_RANK[b.ladder] || sortReady(a.item, b.item))
    .map(({ item: i, ladder }) => ({
      id: i.data.id,
      type: i.type,
      phase: i.data.phase,
      priority: i.data.priority,
      estimate: i.data.estimate,
      status: i.data.status,
      title: String(i.data.title),
      ladder,
    }));
}

export interface SearchHit {
  type: string;
  id: string;
  title: string;
  path: string;
  snippet: string;
}

const SNIPPET_PAD = 40;
const SNIPPET_TAIL = 80;

function excerpt(text: string, q: string, fallback: string): string {
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const at = lower.indexOf(needle);
  if (at < 0) return fallback.slice(0, 160);
  const start = Math.max(0, at - SNIPPET_PAD);
  const end = Math.min(text.length, at + needle.length + SNIPPET_TAIL);
  let s = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) s = `…${s}`;
  if (end < text.length) s = `${s}…`;
  return s;
}

/** Search the loaded markdown index. Empty/whitespace query → []. No SQLite. */
export function searchGraph(ctx: OpContext, q: string): SearchHit[] {
  const query = q.trim();
  if (!query) return [];
  const needle = query.toLowerCase();
  const titleHits: SearchHit[] = [];
  const bodyHits: SearchHit[] = [];
  for (const item of ctx.project.index.items) {
    const id = item.data.id;
    const title = String(item.data.title ?? "");
    const idHit = id.toLowerCase().includes(needle);
    const titleHit = title.toLowerCase().includes(needle);
    if (idHit || titleHit) {
      titleHits.push({ type: item.type, id, title, path: item.rel, snippet: title });
      continue;
    }
    const body = item.body ?? "";
    if (body.toLowerCase().includes(needle)) {
      bodyHits.push({
        type: item.type,
        id,
        title,
        path: item.rel,
        snippet: excerpt(body, query, title),
      });
    }
  }
  return [...titleHits, ...bodyHits];
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

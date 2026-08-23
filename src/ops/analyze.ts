import { isTemplateCriterion, parseChecklist } from "../core/checklist.ts";
import { inboundOf } from "../core/graph.ts";
import { extractSection } from "../core/markdown.ts";
import type { GraphIndex, ParsedItem } from "../core/types.ts";
import type { OpContext } from "./context.ts";

/** ADR-0007: a `covers` token is `ID#N`, N being the 1-based ADR-0003 criterion index. */
const COVERS_RE = /^([^#\s]+)#(\d+)$/;

export interface CoverageRow {
  key: string;
  hasTask: boolean;
  taskIds: string[];
  notes: string;
}

export interface AnalyzeReport {
  coverage: CoverageRow[];
  coveragePercent: number;
  ok: boolean;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function isResolved(status: unknown): boolean {
  return status === "done" || status === "cancelled";
}

function workInbound(index: GraphIndex, id: string, fields: string[]): ParsedItem[] {
  return inboundOf(index, id, fields).filter(
    (other) => other.type === "story" || other.type === "task",
  );
}

function coveringTasks(index: GraphIndex): Map<string, string[]> {
  const byKey = new Map<string, string[]>();
  for (const item of index.items) {
    if (item.type !== "task" || item.data.status === "cancelled") continue;
    for (const token of asStringList(item.data.covers)) {
      const match = COVERS_RE.exec(token.trim());
      if (!match) continue;
      const key = `${match[1]}#${Number(match[2])}`;
      const list = byKey.get(key);
      if (list) list.push(item.data.id);
      else byKey.set(key, [item.data.id]);
    }
  }
  for (const ids of byKey.values()) ids.sort((a, b) => a.localeCompare(b));
  return byKey;
}

function childTasks(index: GraphIndex, storyId: string): ParsedItem[] {
  return inboundOf(index, storyId, ["story"]).filter((item) => item.type === "task");
}

export function analyzeGraph(ctx: OpContext): AnalyzeReport {
  const { index } = ctx.project;
  const covers = coveringTasks(index);
  const coverage: CoverageRow[] = [];
  let countable = 0;
  let covered = 0;
  let uncoveredActiveRules = 0;
  let doneWithOpenChildren = 0;

  for (const item of index.items) {
    if (item.type !== "business-rule" || item.data.status !== "active") continue;
    const inbound = workInbound(index, item.data.id, ["business_rules"]);
    const taskIds = inbound.map((other) => other.data.id).sort((a, b) => a.localeCompare(b));
    const hasTask = taskIds.length > 0;
    countable += 1;
    if (hasTask) covered += 1;
    else uncoveredActiveRules += 1;
    coverage.push({
      key: item.data.id,
      hasTask,
      taskIds,
      notes: hasTask ? "" : "no inbound story/task",
    });
  }

  for (const item of index.items) {
    if (item.type !== "adr" || item.data.status !== "accepted") continue;
    const inbound = workInbound(index, item.data.id, ["adrs"]);
    const taskIds = inbound.map((other) => other.data.id).sort((a, b) => a.localeCompare(b));
    const hasTask = taskIds.length > 0;
    countable += 1;
    if (hasTask) covered += 1;
    coverage.push({
      key: item.data.id,
      hasTask,
      taskIds,
      notes: hasTask ? "" : "no inbound edge",
    });
  }

  for (const item of index.items) {
    if (item.type !== "story" || item.data.status === "cancelled") continue;
    const criteria = parseChecklist(extractSection(item.body, "Acceptance criteria"));
    for (const criterion of criteria) {
      if (isTemplateCriterion(criterion.text)) continue;
      const key = `${item.data.id}#${criterion.index}`;
      const taskIds = covers.get(key) ?? [];
      const hasTask = taskIds.length > 0;
      countable += 1;
      if (hasTask) covered += 1;
      coverage.push({
        key,
        hasTask,
        taskIds,
        notes: hasTask ? "" : "no covering task",
      });
    }
  }

  for (const item of index.items) {
    if (item.type !== "story" || item.data.status !== "done") continue;
    const open = childTasks(index, item.data.id).filter((child) => !isResolved(child.data.status));
    if (open.length === 0) continue;
    doneWithOpenChildren += 1;
    coverage.push({
      key: item.data.id,
      hasTask: true,
      taskIds: open.map((child) => child.data.id).sort((a, b) => a.localeCompare(b)),
      notes: "done with open child tasks",
    });
  }

  return {
    coverage,
    coveragePercent: countable === 0 ? 100 : Math.round((covered / countable) * 100),
    ok: uncoveredActiveRules === 0 && doneWithOpenChildren === 0,
  };
}

import { isTemplateCriterion, parseChecklist } from "../core/checklist.ts";
import { hostJoin } from "../core/config.ts";
import { inboundOf } from "../core/graph.ts";
import { parseJUnit, type TestResult } from "../core/junit.ts";
import { extractSection } from "../core/markdown.ts";
import type { GraphIndex, ParsedItem } from "../core/types.ts";
import type { OpContext } from "./context.ts";

/** ADR-0007: a `covers` token is `ID#N`, N being the 1-based ADR-0003 criterion index. */
const COVERS_RE = /^([^#\s]+)#(\d+)$/;

export interface CoverageRow {
  key: string;
  hasTask: boolean;
  taskIds: string[];
  proved: boolean;
  test?: string;
  notes: string;
}

export interface CriterionProof {
  id: string;
  index: number;
  test?: string;
  status?: string;
}

export interface AnalyzeReport {
  coverage: CoverageRow[];
  coveragePercent: number;
  provedPercent: number;
  proved: CriterionProof[];
  unproven: CriterionProof[];
  ok: boolean;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function isResolved(status: unknown): boolean {
  return status === "done" || status === "cancelled";
}

function joinNotes(...parts: Array<string | false | undefined>): string {
  return parts.filter((p): p is string => Boolean(p)).join("; ");
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

function loadResults(ctx: OpContext): TestResult[] {
  const report = ctx.project.config.checks.report;
  if (!report) return [];
  const abs = hostJoin(ctx.project.projectRoot, report);
  const stat = ctx.fs.stat(abs);
  if (!stat?.isFile) return [];
  return parseJUnit(ctx.fs.readFile(abs));
}

function indexProofs(results: TestResult[]): Map<string, TestResult> {
  const byKey = new Map<string, TestResult>();
  for (const result of results) {
    const haystack = `${result.classname} ${result.name}`;
    for (const match of haystack.matchAll(/([^#\s]+)#(\d+)/g)) {
      const key = `${match[1]}#${Number(match[2])}`;
      const prev = byKey.get(key);
      if (!prev || (result.status === "pass" && prev.status !== "pass")) {
        byKey.set(key, result);
      }
    }
  }
  return byKey;
}

function criterionProof(key: string, hit: TestResult | undefined): CriterionProof {
  const match = COVERS_RE.exec(key);
  const id = match?.[1] ?? key;
  const index = Number(match?.[2] ?? 0);
  if (!hit) return { id, index };
  return { id, index, test: hit.name, status: hit.status };
}

export function analyzeGraph(ctx: OpContext): AnalyzeReport {
  const { index } = ctx.project;
  const covers = coveringTasks(index);
  const proofs = indexProofs(loadResults(ctx));
  const coverage: CoverageRow[] = [];
  const proved: CriterionProof[] = [];
  const unproven: CriterionProof[] = [];
  let countable = 0;
  let covered = 0;
  let criterionCount = 0;
  let provedCount = 0;
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
      proved: false,
      notes: joinNotes(!hasTask && "no inbound story/task", "not machine-ownable"),
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
      proved: false,
      notes: joinNotes(!hasTask && "no inbound edge", "not machine-ownable"),
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
      const hit = proofs.get(key);
      const isProved = hit?.status === "pass";
      countable += 1;
      criterionCount += 1;
      if (hasTask) covered += 1;
      if (isProved) provedCount += 1;
      const row: CoverageRow = {
        key,
        hasTask,
        taskIds,
        proved: isProved,
        notes: hasTask ? "" : "no covering task",
      };
      if (hit) row.test = hit.name;
      coverage.push(row);
      const proof = criterionProof(key, hit);
      if (isProved) proved.push(proof);
      else unproven.push(proof);
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
      proved: false,
      notes: "done with open child tasks",
    });
  }

  return {
    coverage,
    coveragePercent: countable === 0 ? 100 : Math.round((covered / countable) * 100),
    provedPercent: criterionCount === 0 ? 100 : Math.round((provedCount / criterionCount) * 100),
    proved,
    unproven,
    ok: uncoveredActiveRules === 0 && doneWithOpenChildren === 0,
  };
}

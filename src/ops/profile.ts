import { spawnSync } from "node:child_process";
import { hostJoin } from "../core/config.ts";
import type { OpContext } from "./context.ts";

export const MATURITY_LEVELS = ["greenfield", "shaping", "operating", "mature"] as const;
export type MaturityLevel = (typeof MATURITY_LEVELS)[number];

export interface ProfileCounts {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface ProfileKnowledge {
  acceptedAdrs: number;
  activeBrs: number;
}

export interface ProfileGit {
  commits: number;
  firstCommitAt: string | null;
}

export interface ProfileTests {
  framework: string | null;
}

export interface RepoProfile {
  level: MaturityLevel;
  calibration: string[];
  counts: ProfileCounts;
  knowledge: ProfileKnowledge;
  checks: { configured: boolean; commands: string[] };
  codeMap: { configured: boolean; keys: string[] };
  tests: ProfileTests;
  git: ProfileGit | null;
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function detectTests(ctx: OpContext): ProfileTests {
  const pkgPath = hostJoin(ctx.project.projectRoot, "package.json");
  if (!ctx.fs.exists(pkgPath)) return { framework: null };
  try {
    const pkg = JSON.parse(ctx.fs.readFile(pkgPath)) as {
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    const blob = JSON.stringify(pkg.devDependencies ?? {}) + JSON.stringify(pkg.scripts ?? {});
    if (blob.includes("vitest")) return { framework: "vitest" };
    if (blob.includes("jest")) return { framework: "jest" };
    if (blob.includes("mocha")) return { framework: "mocha" };
    if (blob.includes("pytest") || ctx.fs.exists(hostJoin(ctx.project.projectRoot, "pytest.ini"))) {
      return { framework: "pytest" };
    }
  } catch {
    return { framework: null };
  }
  return { framework: null };
}

function readGit(projectRoot: string): ProfileGit | null {
  const count = spawnSync("git", ["rev-list", "--count", "HEAD"], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 3000,
  });
  if (count.status !== 0) return null;
  const commits = Number.parseInt(String(count.stdout).trim(), 10);
  if (!Number.isFinite(commits)) return null;
  const first = spawnSync("git", ["log", "--reverse", "--format=%cI", "-1"], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 3000,
  });
  const firstCommitAt = first.status === 0 ? String(first.stdout).trim() || null : null;
  return { commits, firstCommitAt };
}

export function deriveLevel(input: {
  total: number;
  doneTasks: number;
  inFlight: number;
  acceptedAdrs: number;
  activeBrs: number;
  checksConfigured: boolean;
}): MaturityLevel {
  const { total, doneTasks, inFlight, acceptedAdrs, activeBrs, checksConfigured } = input;
  if (total < 3 && acceptedAdrs === 0) return "greenfield";
  if (checksConfigured && acceptedAdrs >= 1 && activeBrs >= 1 && doneTasks >= 1) return "mature";
  if (inFlight >= 1 || doneTasks >= 1) return "operating";
  return "shaping";
}

function calibrationFor(level: MaturityLevel, knowledge: ProfileKnowledge): string[] {
  if (level === "greenfield") {
    return [
      "Few or no work items and no accepted ADRs — interview harder, invent less architecture, and do not assume a stack.",
      "Search the graph anyway so you resume a live idea instead of duplicating one.",
    ];
  }
  if (level === "shaping") {
    return [
      "Epics or ideas exist but little is done — prefer promoting and shaping over jumping to `pb next`.",
      "Ask what already shipped before proposing a new epic.",
    ];
  }
  if (level === "operating") {
    return [
      "Work is in flight — `pb similar` and `pb ground` before creating items.",
      knowledge.acceptedAdrs
        ? "Accepted ADRs are binding; do not re-litigate them in discover."
        : "No accepted ADRs yet; propose one when a real choice appears.",
    ];
  }
  return [
    "Mature graph: reuse accepted ADRs and active business rules; interview only what is still open.",
    "Prefer `pb next` for ship work; discover only for a genuinely new demand.",
  ];
}

/** Derived repo maturity. Never writes frontmatter. Git is optional enrichment. */
export function profileOf(ctx: OpContext): RepoProfile {
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let doneTasks = 0;
  let inFlight = 0;
  let acceptedAdrs = 0;
  let activeBrs = 0;
  for (const item of ctx.project.index.items) {
    bump(byType, item.type);
    const status = String(item.data.status ?? "");
    if (status) bump(byStatus, status);
    if (item.type === "task" && status === "done") doneTasks += 1;
    if (status === "in-progress" || status === "review") inFlight += 1;
    if (item.type === "adr" && status === "accepted") acceptedAdrs += 1;
    if (item.type === "business-rule" && status === "active") activeBrs += 1;
  }
  const checks = ctx.project.config.checks.commands;
  const codeMapKeys = Object.keys(ctx.project.config.codeMap);
  const counts: ProfileCounts = {
    total: ctx.project.index.items.length,
    byType,
    byStatus,
  };
  const knowledge: ProfileKnowledge = { acceptedAdrs, activeBrs };
  const checksConfigured = checks.length > 0;
  const level = deriveLevel({
    total: counts.total,
    doneTasks,
    inFlight,
    acceptedAdrs,
    activeBrs,
    checksConfigured,
  });
  return {
    level,
    calibration: calibrationFor(level, knowledge),
    counts,
    knowledge,
    checks: { configured: checksConfigured, commands: checks },
    codeMap: { configured: codeMapKeys.length > 0, keys: codeMapKeys },
    tests: detectTests(ctx),
    git: readGit(ctx.project.projectRoot),
  };
}

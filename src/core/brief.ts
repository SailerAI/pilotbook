import { splitRemoteId } from "./ids.ts";
import { extractSection } from "./markdown.ts";
import type {
  Diagnostic,
  FrontmatterValue,
  ParsedItem,
  PeerItem,
  PilotbookConfig,
} from "./types.ts";
import { WORK_TYPES } from "./types.ts";

export type BriefDepth = "full" | "criteria" | "statement" | "title";

export interface BriefSection {
  id: string;
  type: string;
  title: string;
  role: string;
  depth: BriefDepth;
  status?: string;
  warnings: string[];
  body: string;
  rel?: string;
}

/** A section the budget cut, reduced to enough for the agent to pull it back. */
export interface BriefFetch {
  id: string;
  title: string;
  fetch: string;
}

export interface BriefDropped {
  id: string;
  title: string;
  role: string;
}

export interface BriefResult {
  target: string;
  sections: BriefSection[];
  budget: number | null;
  tokens: number;
  truncated: boolean;
  /** Cost of every walked section, ignoring the budget. */
  fullTokens: number;
  dropped: BriefDropped[];
  fetch: BriefFetch[];
  diagnostics: Diagnostic[];
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

function firstParagraph(body: string): string {
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (line.startsWith("#")) {
      if (out.length) break;
      continue;
    }
    if (!line.trim() && out.length) break;
    if (line.trim()) out.push(line);
  }
  return out.join("\n").trim();
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function lookup(
  ref: string,
  byId: Map<string, ParsedItem>,
  peers: Map<string, PeerItem[]>,
): ParsedItem | null {
  const { repo, id } = splitRemoteId(ref);
  if (repo) {
    const peer = peers.get(repo)?.find((p) => p.id === id);
    if (!peer) return null;
    return {
      type: peer.type,
      rel: `${repo}#${id}`,
      abs: "",
      data: { id: peer.id, title: peer.title, type: peer.type, status: peer.status ?? "" },
      body: "",
      positions: {},
      mtimeMs: 0,
    };
  }
  return byId.get(id) ?? null;
}

function contradictions(item: ParsedItem): string[] {
  const out: string[] = [];
  if (item.type === "adr") {
    const sup = asList(item.data.superseded_by);
    if (sup.length) out.push(`SUPERSEDED by ${sup.join(", ")} — do not follow this decision.`);
    if (item.data.status === "deprecated") out.push("DEPRECATED — treat as historical only.");
    if (item.data.status === "rejected") out.push("REJECTED — this decision was not taken.");
  }
  if (item.type === "business-rule" && item.data.status === "deprecated") {
    out.push("DEPRECATED rule — do not enforce.");
  }
  return out;
}

function sliceForDepth(item: ParsedItem, depth: BriefDepth): string {
  if (depth === "title") return "";
  if (depth === "statement") {
    return (
      extractSection(item.body, "Rule") ||
      extractSection(item.body, "Decision") ||
      firstParagraph(item.body)
    );
  }
  if (depth === "criteria") {
    return (
      extractSection(item.body, "Acceptance criteria") ||
      extractSection(item.body, "Outcome") ||
      extractSection(item.body, "Scope") ||
      firstParagraph(item.body)
    );
  }
  return item.body.trim();
}

interface Walked {
  item: ParsedItem;
  role: string;
  depth: BriefDepth;
  /** Graph distance from the target. Hop 1 is the target and what it references directly. */
  hop: number;
}

function walk(
  start: ParsedItem,
  byId: Map<string, ParsedItem>,
  config: PilotbookConfig,
  peers: Map<string, PeerItem[]>,
): Walked[] {
  const seen = new Set<string>();
  const out: Walked[] = [];

  function add(item: ParsedItem | null, role: string, depth: BriefDepth, hop: number): void {
    if (!item) return;
    const key = `${item.data.id}:${role}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ item, role, depth, hop });
  }

  add(start, "target", "full", 1);

  const parentField = config.types[start.type]?.parent;
  let cursor: ParsedItem | null = start;
  const parentChain: ParsedItem[] = [];
  while (cursor) {
    const parentName: string | undefined = config.types[cursor.type]?.parent;
    if (!parentName) break;
    const pid: FrontmatterValue | undefined = cursor.data[parentName];
    const parent: ParsedItem | null = typeof pid === "string" ? lookup(pid, byId, peers) : null;
    if (!parent) break;
    parentChain.push(parent);
    cursor = parent;
  }
  for (const [i, p] of parentChain.entries()) add(p, "parent", "criteria", i + 1);

  const origin = parentChain[0] ?? start;
  for (const field of ["business_rules", "adrs"] as const) {
    for (const ref of asList(origin.data[field]).concat(asList(start.data[field]))) {
      const node = lookup(ref, byId, peers);
      if (!node) continue;
      // A rule or ADR the target inherits is binding, so it never degrades to a stub.
      add(node, field === "adrs" ? "adr" : "rule", "statement", 1);
      if (node.type === "business-rule") {
        for (const rel of asList(node.data.related)) {
          const related = lookup(rel, byId, peers);
          if (related?.type === "business-rule") add(related, "related-rule", "statement", 2);
        }
      }
      if (node.type === "adr") {
        for (const rel of asList(node.data.supersedes).concat(asList(node.data.superseded_by))) {
          add(lookup(rel, byId, peers), "adr-chain", "title", 2);
        }
      }
    }
  }

  const stack = asList(start.data.depends_on).map((ref) => ({ ref, hop: 2 }));
  const depSeen = new Set<string>();
  while (stack.length) {
    const { ref, hop } = stack.pop()!;
    if (depSeen.has(ref)) continue;
    depSeen.add(ref);
    const node = lookup(ref, byId, peers);
    if (!node) continue;
    add(node, "depends_on", "title", hop);
    stack.push(...asList(node.data.depends_on).map((r) => ({ ref: r, hop: hop + 1 })));
  }

  if (parentField) {
    const pid = start.data[parentField];
    if (typeof pid === "string") {
      for (const sib of byId.values()) {
        if (sib.data.id === start.data.id) continue;
        if (sib.type !== start.type) continue;
        if (sib.data[parentField] !== pid) continue;
        if (sib.data.status === "done") add(sib, "sibling-done", "title", 2);
      }
    }
  }

  void config;
  return out;
}

function authorityRank(w: Walked): number {
  if (w.role === "rule" || w.role === "related-rule") return 0;
  if (w.role === "adr" || w.role === "adr-chain") return 1;
  if (w.role === "target") return 2;
  if (w.role === "parent") return 3;
  if (w.role === "depends_on") return 4;
  return 5;
}

export function compileBrief(
  target: ParsedItem,
  items: ParsedItem[],
  config: PilotbookConfig,
  opts: { budget?: number; peers?: Map<string, PeerItem[]> } = {},
): BriefResult {
  const byId = new Map(items.map((i) => [i.data.id, i]));
  const peers = opts.peers ?? new Map();
  const walked = walk(target, byId, config, peers).sort(
    (a, b) => authorityRank(a) - authorityRank(b),
  );

  const budget = opts.budget ?? null;
  const sections: BriefSection[] = [];
  const dropped: BriefDropped[] = [];
  const fetch: BriefFetch[] = [];
  const diagnostics: Diagnostic[] = [];
  let tokens = 0;
  let truncated = false;

  const area = typeof target.data.area === "string" ? target.data.area : "";
  const tags = asList(target.data.tags);
  const codePaths: string[] = [];
  for (const [key, paths] of Object.entries(config.codeMap)) {
    if (key === area || tags.includes(key)) codePaths.push(...paths);
  }

  const candidates = walked.map((w) => {
    const section: BriefSection = {
      id: w.item.data.id,
      type: w.item.type,
      title: String(w.item.data.title ?? ""),
      role: w.role,
      depth: w.depth,
      status: typeof w.item.data.status === "string" ? w.item.data.status : undefined,
      warnings: contradictions(w.item),
      body: sliceForDepth(w.item, w.depth),
      rel: w.item.rel,
    };
    return { walked: w, section, cost: estimateTokens(renderSection(section)) };
  });

  const codeSection: BriefSection | null = codePaths.length
    ? {
        id: "code-map",
        type: "code",
        title: "Code paths",
        role: "code-map",
        depth: "title",
        warnings: [],
        body: codePaths.map((p) => `- ${p}`).join("\n"),
      }
    : null;
  const codeCost = codeSection ? estimateTokens(renderSection(codeSection)) : 0;

  // Costed up front so a truncation diagnostic can name a budget that fits the whole brief.
  const fullTokens = candidates.reduce((sum, c) => sum + c.cost, 0) + codeCost;

  function cut(w: Walked): void {
    const id = w.item.data.id;
    const title = String(w.item.data.title ?? "");
    if (w.hop > 1) fetch.push({ id, title, fetch: `pb brief ${id}` });
    else dropped.push({ id, title, role: w.role });
  }

  for (const [i, candidate] of candidates.entries()) {
    if (budget != null && tokens + candidate.cost > budget && sections.length > 0) {
      truncated = true;
      for (const rest of candidates.slice(i)) cut(rest.walked);
      break;
    }
    tokens += candidate.cost;
    sections.push(candidate.section);
  }

  if (codeSection) {
    if (budget == null || tokens + codeCost <= budget) {
      tokens += codeCost;
      sections.push(codeSection);
    } else {
      truncated = true;
      dropped.push({ id: codeSection.id, title: codeSection.title, role: codeSection.role });
    }
  }

  if (truncated) {
    const n = dropped.length + fetch.length;
    diagnostics.push({
      code: "brief_truncated",
      severity: "warning",
      message: `dropped ${n} section(s) at budget ${budget}`,
      file: target.rel,
      line: 1,
      column: 1,
      target: target.data.id,
      fix: `pb brief ${target.data.id} --budget ${Math.ceil(fullTokens * 1.2)}`,
    });
  }

  void WORK_TYPES;
  return {
    target: target.data.id,
    sections,
    budget,
    tokens,
    truncated,
    fullTokens,
    dropped,
    fetch,
    diagnostics,
  };
}

export function renderSection(section: BriefSection): string {
  const bits = [
    `### ${section.id} — ${section.title}`,
    `_${section.role} · ${section.type}${section.status ? ` · ${section.status}` : ""}_`,
  ];
  for (const w of section.warnings) bits.push(`> **${w}**`);
  if (section.body) bits.push("", section.body);
  return bits.join("\n");
}

export function renderBriefMarkdown(brief: BriefResult): string {
  const lines = [
    `# Brief: ${brief.target}`,
    "",
    `_tokens ≈ ${brief.tokens}${brief.budget ? ` / ${brief.budget}` : ""}${brief.truncated ? " · truncated" : ""}_`,
    "",
  ];
  for (const d of brief.diagnostics) {
    lines.push(`> **${d.severity} ${d.code}** — ${d.message}`);
    if (d.fix) lines.push(`> Fix: \`${d.fix}\``);
    lines.push("");
  }
  if (brief.dropped.length) {
    lines.push(
      "## Dropped",
      brief.dropped.map((d) => `- ${d.id} — ${d.title} (${d.role})`).join("\n"),
      "",
    );
  }
  for (const s of brief.sections) {
    lines.push(renderSection(s), "");
  }
  if (brief.fetch.length) {
    lines.push(
      "## Fetch on demand",
      brief.fetch.map((f) => `- ${f.id} — ${f.title} · \`${f.fetch}\``).join("\n"),
      "",
    );
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

import path from "node:path";
import { parseChecklist } from "./checklist.ts";
import { findCycle } from "./cycles.ts";
import { bodyHash, contentHash } from "./hash.ts";
import { splitRemoteId } from "./ids.ts";
import { extractSection } from "./markdown.ts";
import {
  DATE_RE,
  type Diagnostic,
  type GraphIndex,
  type ParsedItem,
  type PeerItem,
  type PilotbookConfig,
  type Position,
  WORK_TYPES,
} from "./types.ts";

function pos(item: ParsedItem, field: string): Position {
  return item.positions[field] ?? { line: 1, column: 1 };
}

function err(
  item: ParsedItem,
  code: string,
  message: string,
  field: string,
  suggestion?: string,
  fix?: string,
): Diagnostic {
  const p = pos(item, field);
  return {
    code,
    severity: "error",
    message,
    file: item.rel,
    line: p.line,
    column: p.column,
    suggestion,
    fix,
  };
}

function warn(
  item: ParsedItem,
  code: string,
  message: string,
  field: string,
  suggestion?: string,
): Diagnostic {
  const p = pos(item, field);
  return {
    code,
    severity: "warning",
    message,
    file: item.rel,
    line: p.line,
    column: p.column,
    suggestion,
  };
}

function fileErr(file: string, code: string, message: string, suggestion?: string): Diagnostic {
  return { code, severity: "error", message, file, line: 1, column: 1, suggestion };
}

function isRemote(ref: string): boolean {
  return ref.includes("#");
}

function resolveRef(
  ref: string,
  index: GraphIndex,
  peers: Map<string, PeerItem[]>,
): { item?: ParsedItem; peer?: PeerItem; missing?: boolean } {
  const { repo, id } = splitRemoteId(ref);
  if (!repo) {
    const item = index.byId.get(id);
    return item ? { item } : { missing: true };
  }
  const list = peers.get(repo);
  if (!list) return { missing: true };
  const peer = list.find((p) => p.id === id);
  return peer ? { peer } : { missing: true };
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value) return [value];
  return [];
}

function isResolvedStatus(status: unknown): boolean {
  return status === "done" || status === "cancelled";
}

/** ADR-0007: a `covers` token is `ID#N`, N being the 1-based ADR-0003 criterion index. */
const COVERS_RE = /^([^#\s]+)#(\d+)$/;

export interface LintResult {
  errors: Diagnostic[];
  warnings: Diagnostic[];
  count: number;
}

export function lintGraph(
  index: GraphIndex,
  config: PilotbookConfig,
  peers: Map<string, PeerItem[]> = new Map(),
): LintResult {
  const errors = [...index.errors];
  const warnings: Diagnostic[] = [];
  const { items, byId } = index;

  const seen = new Map<string, ParsedItem[]>();
  for (const item of items) {
    const id = item.data.id;
    if (!id) continue;
    const list = seen.get(id);
    if (list) list.push(item);
    else seen.set(id, [item]);
  }
  for (const [id, group] of seen) {
    if (group.length > 1) {
      for (const item of group) {
        errors.push(
          err(
            item,
            "duplicate-id",
            `duplicate id ${id}: ${group.map((g) => g.rel).join(", ")}`,
            "id",
            "Rename or delete the extra file; IDs are never reused.",
          ),
        );
      }
    }
  }

  for (const item of items) {
    const cfg = config.types[item.type];
    if (!cfg) {
      errors.push(fileErr(item.rel, "unknown-type", `unknown type "${item.type}"`));
      continue;
    }
    const data = item.data;

    const optional = cfg.optional ?? [];
    for (const field of cfg.required) {
      if (optional.includes(field)) continue;
      const value = data[field];
      if (value === undefined || value === "") {
        errors.push(
          err(
            item,
            "missing-field",
            `missing required field "${field}"`,
            field,
            `Add \`${field}:\` to the frontmatter.`,
          ),
        );
      }
    }
    for (const key of Object.keys(data)) {
      if (!cfg.required.includes(key) && !optional.includes(key) && !cfg.objects.includes(key)) {
        errors.push(
          err(
            item,
            "unknown-field",
            `unknown field "${key}"`,
            key,
            `Remove \`${key}\` or add it to the type schema.`,
          ),
        );
      }
    }

    if (data.type && data.type !== item.type) {
      errors.push(
        err(
          item,
          "type-mismatch",
          `type "${data.type}" does not match folder type "${item.type}"`,
          "type",
          `Set \`type: ${item.type}\`.`,
        ),
      );
    }

    if (typeof data.id === "string") {
      if (!cfg.idPattern.test(data.id)) {
        errors.push(
          err(
            item,
            "bad-id",
            `id "${data.id}" does not match ${cfg.idPattern}`,
            "id",
            `Use ${cfg.prefix}${"0".repeat(cfg.pad)}.`,
          ),
        );
      }
      const base = path.posix.basename(item.rel);
      if (!base.startsWith(`${data.id}-`) || !base.endsWith(".md")) {
        errors.push(
          err(
            item,
            "filename-mismatch",
            `filename must be ${data.id}-<slug>.md`,
            "id",
            `Rename the file to ${data.id}-<slug>.md.`,
          ),
        );
      }
    }

    for (const [field, allowed] of Object.entries(cfg.enums)) {
      if (field in data && data[field] !== undefined && data[field] !== "") {
        const value = data[field];
        if (typeof value === "string" && !allowed.includes(value)) {
          errors.push(
            err(
              item,
              "invalid-enum",
              `${field}="${value}" is invalid (expected ${allowed.join(" | ")})`,
              field,
              `Use one of: ${allowed.join(", ")}.`,
            ),
          );
        }
      }
    }
    for (const field of cfg.arrays) {
      if (field in data && data[field] !== undefined && !Array.isArray(data[field])) {
        errors.push(
          err(
            item,
            "not-array",
            `${field} must be an inline array`,
            field,
            `Write \`${field}: []\` or \`${field}: [A, B]\`.`,
          ),
        );
      }
    }
    for (const field of cfg.numbers) {
      if (
        field in data &&
        data[field] !== undefined &&
        data[field] !== "" &&
        typeof data[field] !== "number"
      ) {
        errors.push(err(item, "not-number", `${field} must be a number`, field));
      }
    }
    for (const field of cfg.dates) {
      if (field in data && data[field] !== undefined && data[field] !== "") {
        if (typeof data[field] !== "string" || !DATE_RE.test(data[field])) {
          errors.push(err(item, "not-date", `${field} must be YYYY-MM-DD`, field));
        }
      }
    }

    if (cfg.parent) {
      const field = cfg.parent;
      const parentId = data[field];
      if (typeof parentId === "string" && parentId) {
        const resolved = resolveRef(parentId, index, peers);
        if (resolved.missing) {
          errors.push(
            err(
              item,
              "dangling-ref",
              `dangling ${field} ${parentId}`,
              field,
              `Create ${parentId} or fix the reference.`,
            ),
          );
        } else if (resolved.item && resolved.item.type !== cfg.parent) {
          errors.push(
            err(item, "wrong-type-ref", `${field} ${parentId} is not a ${cfg.parent}`, field),
          );
        }
      }
    }
  }

  for (const item of items) {
    for (const [field, kind] of Object.entries(config.edges)) {
      if (config.types[item.type]?.parent === field) continue; // already checked
      const values = kind.scalar
        ? asStringList(item.data[field]).slice(0, 1)
        : asStringList(item.data[field]);
      for (const ref of values) {
        if (isRemote(ref)) {
          const resolved = resolveRef(ref, index, peers);
          if (resolved.missing) {
            errors.push(
              err(
                item,
                "dangling-ref",
                `dangling ${field} ${ref}`,
                field,
                `Add a peer manifest that contains ${ref}, or drop the edge.`,
              ),
            );
          }
          continue;
        }
        const target = byId.get(ref);
        if (!target) {
          errors.push(
            err(
              item,
              "dangling-ref",
              `dangling ${field} ${ref}`,
              field,
              `Create ${ref} or remove it from ${field}.`,
            ),
          );
          continue;
        }
        if (!kind.to.includes("*") && !kind.to.includes(target.type)) {
          errors.push(
            err(item, "wrong-type-ref", `${ref} is not one of: ${kind.to.join(", ")}`, field),
          );
        }
      }
    }
  }

  const depGraph = new Map<string, string[]>();
  for (const item of items) {
    if (!WORK_TYPES.includes(item.type)) continue;
    depGraph.set(
      item.data.id,
      asStringList(item.data.depends_on).filter((r) => !isRemote(r)),
    );
  }
  const cycle = findCycle(depGraph);
  if (cycle) {
    const first = byId.get(cycle[0] ?? "");
    const d: Diagnostic = {
      code: "dependency-cycle",
      severity: "error",
      message: `dependency cycle: ${cycle.join(" -> ")}`,
      file: first?.rel ?? "",
      line: first ? pos(first, "depends_on").line : 1,
      column: first ? pos(first, "depends_on").column : 1,
      suggestion: "Remove one edge in the cycle.",
    };
    errors.push(d);
  }

  for (const [field, kind] of Object.entries(config.edges)) {
    if (!kind.acyclic || field === "depends_on") continue;
    const g = new Map<string, string[]>();
    for (const item of items) {
      g.set(
        item.data.id,
        asStringList(item.data[field]).filter((r) => !isRemote(r)),
      );
    }
    const c = findCycle(g);
    if (c) {
      errors.push({
        code: "edge-cycle",
        severity: "error",
        message: `${field} cycle: ${c.join(" -> ")}`,
        file: byId.get(c[0] ?? "")?.rel ?? "",
        line: 1,
        column: 1,
      });
    }
  }

  const storiesByEpic = new Map<string, ParsedItem[]>();
  const tasksByStory = new Map<string, ParsedItem[]>();
  for (const item of items) {
    if (item.type === "story" && typeof item.data.epic === "string") {
      const list = storiesByEpic.get(item.data.epic) ?? [];
      list.push(item);
      storiesByEpic.set(item.data.epic, list);
    }
    if (item.type === "task" && typeof item.data.story === "string") {
      const list = tasksByStory.get(item.data.story) ?? [];
      list.push(item);
      tasksByStory.set(item.data.story, list);
    }
  }

  for (const epic of items.filter((i) => i.type === "epic")) {
    if (epic.data.status !== "done") continue;
    const children = storiesByEpic.get(epic.data.id) ?? [];
    const open = children.filter((c) => !isResolvedStatus(c.data.status));
    if (open.length) {
      warnings.push(
        warn(
          epic,
          "open-children",
          `epic is done but has open stories (${open.map((c) => c.data.id).join(", ")})`,
          "status",
        ),
      );
    }
  }
  for (const story of items.filter((i) => i.type === "story")) {
    if (story.data.status !== "done") continue;
    const children = tasksByStory.get(story.data.id) ?? [];
    const open = children.filter((c) => !isResolvedStatus(c.data.status));
    if (open.length) {
      warnings.push(
        warn(
          story,
          "open-children",
          `story is done but has open tasks (${open.map((c) => c.data.id).join(", ")})`,
          "status",
        ),
      );
    }
  }

  for (const item of items) {
    if (!WORK_TYPES.includes(item.type)) continue;
    if (item.data.status !== "done") continue;
    const cfg = config.types[item.type];
    if (!cfg?.objects.includes("verified")) continue;
    if (config.checks.commands.length === 0) continue;
    const verified = item.data.verified;
    if (!verified || typeof verified !== "object" || Array.isArray(verified)) {
      errors.push(
        err(
          item,
          "unverified-done",
          `${item.data.id} is done but has no verified block`,
          "status",
          `Run \`pb verify ${item.data.id}\` or pass --force.`,
        ),
      );
      continue;
    }
    const hash = typeof verified.hash === "string" ? verified.hash : "";
    const current = contentHash(item.data, item.body, cfg.required);
    if (hash && hash !== current && verified.bypassed !== true && verified.bypassed !== "true") {
      errors.push(
        err(
          item,
          "stale-verified",
          `${item.data.id} changed since it was verified (hash ${hash} ≠ ${current})`,
          "verified",
          `Run \`pb verify ${item.data.id}\` again.`,
        ),
      );
    }
  }

  for (const item of items) {
    if (item.type !== "adr") continue;
    const supersededBy = asStringList(item.data.superseded_by);
    if (supersededBy.length && item.data.status !== "superseded") {
      warnings.push(
        warn(
          item,
          "superseded-status",
          `${item.data.id} has superseded_by but status is ${item.data.status}`,
          "status",
          "Set `status: superseded`.",
        ),
      );
    }
    if (item.data.status === "deprecated") {
      warnings.push(warn(item, "deprecated-adr", `${item.data.id} is deprecated`, "status"));
    }
  }

  for (const item of items) {
    if (item.type !== "business-rule") continue;
    if (item.data.status === "deprecated") {
      warnings.push(warn(item, "deprecated-rule", `${item.data.id} is deprecated`, "status"));
    }
  }

  for (const item of items) {
    if (item.type !== "task") continue;
    const story = item.data.story;
    if (typeof story === "string" && story) continue;
    const estimate = item.data.estimate;
    const priority = item.data.priority;
    const large = typeof estimate === "number" && estimate >= 3;
    if (large || priority === "P0") {
      warnings.push(
        warn(
          item,
          "parentless-task",
          `${item.data.id} has no story and estimate>=3 or priority P0; it probably wants a story`,
          "story",
          "File it under a story, or keep it small.",
        ),
      );
    }
  }

  for (const item of items) {
    if (item.type !== "task") continue;
    for (const token of asStringList(item.data.covers)) {
      const match = COVERS_RE.exec(token.trim());
      if (!match) {
        warnings.push(
          warn(
            item,
            "unbound-criterion",
            `covers "${token}" is not an ID#N token`,
            "covers",
            "Write `covers: [US-001#2]`, where N is the 1-based criterion index.",
          ),
        );
        continue;
      }
      const targetId = match[1]!;
      const wanted = Number(match[2]);
      const target = byId.get(targetId);
      if (!target) {
        errors.push(
          err(
            item,
            "dangling-ref",
            `dangling covers ${targetId}`,
            "covers",
            `Create ${targetId} or remove ${token} from covers.`,
          ),
        );
        continue;
      }
      const criteria = parseChecklist(extractSection(target.body, "Acceptance criteria"));
      if (wanted < 1 || wanted > criteria.length) {
        warnings.push(
          warn(
            item,
            "unbound-criterion",
            `covers ${token} but ${targetId} has ${criteria.length} criteri${criteria.length === 1 ? "on" : "a"}`,
            "covers",
            `Point covers at an existing criterion of ${targetId}, or add the criterion.`,
          ),
        );
      }
    }
  }

  for (const item of items) {
    const activeRule = item.type === "business-rule" && item.data.status === "active";
    const acceptedAdr = item.type === "adr" && item.data.status === "accepted";
    if (!activeRule && !acceptedAdr) continue;
    const stored = typeof item.data.content_hash === "string" ? item.data.content_hash : "";
    const current = bodyHash(item.body);
    if (stored && stored !== current) {
      const id = item.data.id;
      errors.push(
        err(
          item,
          "stale-content-hash",
          `${id} body hash ${current} does not match content_hash ${stored}`,
          "content_hash",
          `pb bump ${id}`,
          `pb bump ${id}`,
        ),
      );
    }
  }

  return { errors, warnings, count: items.length };
}

export function formatGithub(diagnostics: Diagnostic[]): string {
  return diagnostics
    .map((d) => {
      const level = d.severity === "warning" ? "warning" : "error";
      const file = d.file.replaceAll("\\", "/");
      return `::${level} file=${file},line=${d.line},col=${d.column},title=${d.code}::${d.message}`;
    })
    .join("\n");
}

export function formatDiagnostic(d: Diagnostic): string {
  const loc = d.file ? `${d.file}:${d.line}:${d.column}` : "";
  const sug = d.suggestion ? ` (${d.suggestion})` : "";
  const fix = d.fix && d.fix !== d.suggestion ? ` fix: ${d.fix}` : "";
  return `${d.severity} ${d.code} ${loc} ${d.message}${sug}${fix}`.trim();
}

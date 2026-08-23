import { hostJoin, toPosix } from "../core/config.ts";
import { cycleIfAdded } from "../core/cycles.ts";
import { parseFrontmatter, serializeItem, today } from "../core/frontmatter.ts";
import { loadGraph, refsOf, toPublic } from "../core/graph.ts";
import { nextId, slugify, splitRemoteId } from "../core/ids.ts";
import { type ItemData, type ParsedItem, type PublicItem, WORK_TYPES } from "../core/types.ts";
import { type OpContext, PilotbookError, reload } from "./context.ts";

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

function coerce(
  cfg: { arrays: string[]; numbers: string[] },
  key: string,
  value: unknown,
): unknown {
  if (cfg.arrays.includes(key)) {
    if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
    if (typeof value === "string")
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    if (value == null) return [];
    return [String(value)];
  }
  if (cfg.numbers.includes(key)) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) throw new PilotbookError(`${key} must be a number`);
    return n;
  }
  return value ?? "";
}

function depGraph(items: ParsedItem[]): Map<string, string[]> {
  const g = new Map<string, string[]>();
  for (const item of items) {
    if (!WORK_TYPES.includes(item.type)) continue;
    g.set(
      item.data.id,
      asList(item.data.depends_on).filter((r) => !r.includes("#")),
    );
  }
  return g;
}

function assertRefs(ctx: OpContext, data: ItemData, type: string): void {
  const { config, index, peers } = ctx.project;
  const cfg = config.types[type];
  if (!cfg) throw new PilotbookError(`unknown type: ${type}`);

  if (cfg.parent) {
    const parentId = data[cfg.parent];
    if (!parentId) throw new PilotbookError(`${type}s require ${cfg.parent}`);
    const id = String(parentId);
    const { repo } = splitRemoteId(id);
    if (repo) {
      const found = peers.get(repo)?.some((p) => p.id === splitRemoteId(id).id);
      if (!found) throw new PilotbookError(`dangling ${cfg.parent} ${id}`, "dangling-ref");
    } else {
      const parent = index.byId.get(id);
      if (!parent) throw new PilotbookError(`dangling ${cfg.parent} ${id}`, "dangling-ref");
      if (parent.type !== cfg.parent) {
        throw new PilotbookError(`${cfg.parent} ${id} is not a ${cfg.parent}`, "wrong-type-ref");
      }
    }
  }

  for (const [field, kind] of Object.entries(config.edges)) {
    const values = kind.scalar ? asList(data[field]).slice(0, 1) : asList(data[field]);
    for (const ref of values) {
      const { repo, id } = splitRemoteId(ref);
      if (repo) {
        const found = peers.get(repo)?.some((p) => p.id === id);
        if (!found) throw new PilotbookError(`dangling ${field} ${ref}`, "dangling-ref");
        continue;
      }
      const target = index.byId.get(id);
      if (!target) throw new PilotbookError(`dangling ${field} ${ref}`, "dangling-ref");
      if (!kind.to.includes("*") && !kind.to.includes(target.type)) {
        throw new PilotbookError(`${id} is not one of: ${kind.to.join(", ")}`, "wrong-type-ref");
      }
    }
  }

  const from = typeof data.id === "string" ? data.id : "";
  if (from) {
    const g = depGraph(index.items);
    for (const ref of asList(data.depends_on)) {
      if (ref.includes("#")) continue;
      const cycle = cycleIfAdded(g, from, ref);
      if (cycle) {
        throw new PilotbookError(`dependency cycle: ${cycle.join(" -> ")}`, "dependency-cycle");
      }
    }
  }
}

function templateDir(ctx: OpContext): string {
  const local = hostJoin(ctx.project.projectRoot, "templates");
  if (ctx.fs.exists(hostJoin(local, "epic.md"))) return local;
  return bundledTemplates();
}

export function bundledTemplates(): string {
  const here = new URL(".", import.meta.url);
  // dist/ops/index.mjs -> ../../templates  OR src/ops -> ../../templates
  const fromDist = new URL("../../templates/", here);
  const fromSrc = new URL("../../templates/", here);
  return fromSrc.pathname.endsWith("templates/")
    ? fileURLToPathSafe(fromDist)
    : fileURLToPathSafe(fromSrc);
}

function fileURLToPathSafe(url: URL): string {
  const p = url.pathname;
  return decodeURIComponent(process.platform === "win32" && p.startsWith("/") ? p.slice(1) : p);
}

function fillTemplate(text: string, vars: Record<string, string>): string {
  let out = text;
  for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{{${k}}}`, v);
  return out;
}

export function createItem(
  ctx: OpContext,
  input: {
    type: string;
    title: string;
    body?: string;
    [key: string]: unknown;
  },
): PublicItem {
  const type = String(input.type);
  const cfg = ctx.project.config.types[type];
  if (!cfg) throw new PilotbookError(`unknown type: ${type}`);
  const title = String(input.title ?? "").trim();
  if (!title) throw new PilotbookError("title is required");

  const id = nextId(type, cfg, ctx.project.index.items);
  const slug = slugify(title) || "untitled";
  const rel = toPosix(`${ctx.project.config.root}/${cfg.dir}/${id}-${slug}.md`);
  const abs = hostJoin(ctx.project.projectRoot, rel);
  if (ctx.fs.exists(abs)) throw new PilotbookError(`file already exists: ${rel}`);

  const date = today();
  const tplPath = hostJoin(templateDir(ctx), cfg.template);
  let filled: string;
  if (ctx.fs.exists(tplPath)) {
    filled = fillTemplate(ctx.fs.readFile(tplPath), {
      id,
      title,
      date,
      epic: String(input.epic ?? "EPIC-000"),
      story: String(input.story ?? "US-000"),
      goal: String(input.goal || "Describe the outcome of this epic."),
    });
  } else {
    filled = serializeItem(
      { id, title, type, status: "backlog", created: date, updated: date },
      `## ${title}\n`,
      cfg.required,
    );
  }

  const parsed = parseFrontmatter(filled, rel);
  const extras: Record<string, unknown> = { ...input };
  delete extras.type;
  delete extras.title;
  delete extras.body;
  const next: ItemData = { ...parsed.data, id, type, title, created: date, updated: date };
  for (const [k, v] of Object.entries(extras)) {
    if (v === undefined) continue;
    next[k] = coerce(cfg, k, v) as ItemData[string];
  }
  if (input.body) parsed.body = String(input.body);

  assertRefs(
    {
      ...ctx,
      project: {
        ...ctx.project,
        index: {
          ...ctx.project.index,
          items: [
            ...ctx.project.index.items,
            {
              ...parsed,
              type,
              rel,
              abs,
              data: next,
              body: parsed.body,
              positions: parsed.positions,
              mtimeMs: 0,
            },
          ],
        },
      },
    },
    next,
    type,
  );

  const text = serializeItem(next, parsed.body, cfg.required, cfg.objects);
  ctx.fs.mkdirp(hostJoin(abs, ".."));
  ctx.fs.writeFile(abs, text);
  reload(ctx);
  const created = ctx.project.index.byId.get(id);
  if (!created) throw new PilotbookError(`failed to create ${id}`);
  writeBoard(ctx);
  return toPublic(created);
}

export function updateItem(
  ctx: OpContext,
  id: string,
  patch: { data?: Record<string, unknown>; body?: string },
): PublicItem {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  const cfg = ctx.project.config.types[item.type]!;
  const next: ItemData = {
    ...item.data,
    id: item.data.id,
    type: item.type,
    created: item.data.created,
    updated: today(),
  };
  for (const [k, v] of Object.entries(patch.data ?? {})) {
    if (k === "id" || k === "type" || k === "created") continue;
    next[k] = coerce(cfg, k, v) as ItemData[string];
  }
  const nextBody = patch.body !== undefined ? patch.body : item.body;
  if (cfg.enums.status && next.status && !cfg.enums.status.includes(String(next.status))) {
    throw new PilotbookError(`invalid status "${String(next.status)}" for ${item.type}`);
  }
  assertRefs(ctx, next, item.type);
  ctx.fs.writeFile(item.abs, serializeItem(next, nextBody, cfg.required, cfg.objects));
  reload(ctx);
  const updated = ctx.project.index.byId.get(id);
  if (!updated) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  writeBoard(ctx);
  return toPublic(updated);
}

export function deleteItem(ctx: OpContext, id: string): { deleted: string; rel: string } {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  const blockers = ctx.project.index.items.filter(
    (other) => other.data.id !== id && refsOf(other, ctx.project.config.edges).includes(id),
  );
  if (blockers.length) {
    throw new PilotbookError(
      `cannot delete ${id}: referenced by ${blockers.map((b) => b.data.id).join(", ")}`,
      "conflict",
      409,
    );
  }
  ctx.fs.unlink(item.abs);
  const rel = item.rel;
  reload(ctx);
  writeBoard(ctx);
  return { deleted: id, rel };
}

export function getItem(ctx: OpContext, id: string): PublicItem {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  return toPublic(item);
}

export function listItems(ctx: OpContext): { items: PublicItem[]; errors: string[] } {
  return {
    items: ctx.project.index.items.map(toPublic),
    errors: ctx.project.index.errors.map((e) => e.message),
  };
}

export function schemaOf(ctx: OpContext): {
  types: Record<
    string,
    {
      required: string[];
      enums: Record<string, string[]>;
      arrays: string[];
      numbers: string[];
      dates: string[];
      statuses: string[] | undefined;
      group: string;
    }
  >;
  workTypes: readonly string[];
} {
  const types: Record<
    string,
    {
      required: string[];
      enums: Record<string, string[]>;
      arrays: string[];
      numbers: string[];
      dates: string[];
      statuses: string[] | undefined;
      group: string;
    }
  > = {};
  for (const [name, cfg] of Object.entries(ctx.project.config.types)) {
    types[name] = {
      required: cfg.required,
      enums: cfg.enums,
      arrays: cfg.arrays,
      numbers: cfg.numbers,
      dates: cfg.dates,
      statuses: cfg.enums.status,
      group: cfg.group,
    };
  }
  return { types, workTypes: WORK_TYPES };
}

export function writeBoard(ctx: OpContext): string {
  const { projectRoot, config, index } = ctx.project;
  const work = index.items.filter((i) => WORK_TYPES.includes(i.type));
  const generated = today();
  const lines: string[] = [
    "# Backlog board",
    "",
    "Generated by `pb board`. Do not edit.",
    "",
    `_Last generated: ${generated}_`,
    "",
    "## By status",
    "",
  ];
  const statuses = [...new Set(work.map((i) => String(i.data.status)))];
  const order = ["backlog", "todo", "in-progress", "review", "blocked", "done", "cancelled"];
  statuses.sort((a, b) => order.indexOf(a) - order.indexOf(b) || a.localeCompare(b));
  for (const status of statuses) {
    const bucket = work.filter((i) => i.data.status === status);
    lines.push(`### ${status} (${bucket.length})`, "");
    if (!bucket.length) {
      lines.push("_Empty._", "");
      continue;
    }
    lines.push("| ID | Title | Type | Pri |", "| --- | --- | --- | --- |");
    for (const item of bucket) {
      const rel = toPosix(item.rel.replace(`${config.root}/`, ""));
      lines.push(
        `| [${item.data.id}](${rel}) | ${item.data.title} | ${item.type} | ${String(item.data.priority ?? "—")} |`,
      );
    }
    lines.push("");
  }
  const outRel = toPosix(`${config.root}/${config.board}`);
  const abs = hostJoin(projectRoot, outRel);
  ctx.fs.mkdirp(hostJoin(abs, ".."));
  ctx.fs.writeFile(abs, `${lines.join("\n")}\n`);
  void loadGraph;
  return outRel;
}

import { hostJoin, persistNotionDatabases } from "../core/config.ts";
import { bodyHash } from "../core/hash.ts";
import type {
  NotionDatabaseRef,
  NotionInteropConfig,
  ParsedItem,
  PilotbookConfig,
  TypeConfig,
} from "../core/types.ts";
import { SIZE } from "../core/types.ts";
import { type OpContext, PilotbookError, reload } from "./context.ts";
import { createItem, updateItem } from "./items.ts";

export const NOTION_TYPE_ORDER = ["adr", "business-rule", "idea", "epic", "story", "task"] as const;

export const NOTION_API = "https://api.notion.com/v1";

export type FetchLike = (
  input: string | URL,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export type SyncActionKind = "create" | "update" | "skip" | "conflict" | "intake";

export interface SyncAction {
  action: SyncActionKind;
  side: "to" | "from";
  id: string;
  type?: string;
  detail?: string;
}

export interface SyncResult {
  dryRun: boolean;
  init: boolean;
  to: boolean;
  from: boolean;
  actions: SyncAction[];
  databases: Record<string, NotionDatabaseRef>;
}

export interface SyncOpts {
  init?: boolean;
  to?: boolean;
  from?: boolean;
  dryRun?: boolean;
  fetch?: FetchLike;
  env?: Record<string, string | undefined>;
}

interface PageMapEntry {
  pageId: string;
  pushHash: string;
}

interface NotionMapFile {
  pages: Record<string, PageMapEntry>;
}

interface NotionProp {
  type?: string;
  title?: Array<{ plain_text?: string; text?: { content?: string } }>;
  rich_text?: Array<{ plain_text?: string; text?: { content?: string } }>;
  select?: { name?: string } | null;
  multi_select?: Array<{ name?: string }>;
  number?: number | null;
  date?: { start?: string } | null;
}

interface NotionPage {
  id: string;
  properties?: Record<string, NotionProp>;
}

const BIDIR = ["title", "status", "owner", "priority", "tags", "estimate", "phase"] as const;

const DB_TITLES: Record<(typeof NOTION_TYPE_ORDER)[number], string> = {
  epic: "Pilotbook Epics",
  story: "Pilotbook Stories",
  task: "Pilotbook Tasks",
  idea: "Pilotbook Ideas",
  adr: "Pilotbook ADRs",
  "business-rule": "Pilotbook Business rules",
};

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

function notionCfg(config: PilotbookConfig): NotionInteropConfig | undefined {
  return config.interop.notion;
}

function mapPath(ctx: OpContext): string {
  return hostJoin(ctx.project.projectRoot, `${ctx.project.config.cacheDir}/notion-map.json`);
}

function loadMap(ctx: OpContext): NotionMapFile {
  const abs = mapPath(ctx);
  if (!ctx.fs.exists(abs)) return { pages: {} };
  try {
    const parsed = JSON.parse(ctx.fs.readFile(abs)) as NotionMapFile;
    return { pages: parsed.pages ?? {} };
  } catch {
    return { pages: {} };
  }
}

function saveMap(ctx: OpContext, map: NotionMapFile): void {
  const abs = mapPath(ctx);
  ctx.fs.mkdirp(hostJoin(abs, ".."));
  ctx.fs.writeFile(abs, `${JSON.stringify(map, null, 2)}\n`);
}

function hasField(cfg: TypeConfig, key: string): boolean {
  return cfg.required.includes(key) || (cfg.optional ?? []).includes(key);
}

function scalarSnapshot(item: ParsedItem, cfg: TypeConfig): Record<string, unknown> {
  const snap: Record<string, unknown> = {};
  for (const key of BIDIR) {
    if (!hasField(cfg, key) && key !== "title") continue;
    snap[key] = item.data[key] ?? null;
  }
  return snap;
}

function scalarHash(item: ParsedItem, cfg: TypeConfig): string {
  return bodyHash(JSON.stringify(scalarSnapshot(item, cfg)));
}

function textOf(prop: NotionProp | undefined, kind: "title" | "rich_text"): string {
  const runs = kind === "title" ? prop?.title : prop?.rich_text;
  if (!runs?.length) return "";
  return runs.map((r) => r.plain_text ?? r.text?.content ?? "").join("");
}

function titleProp(content: string): Record<string, unknown> {
  return { title: [{ type: "text", text: { content: content.slice(0, 2000) } }] };
}

function richTextProp(content: string): Record<string, unknown> {
  return { rich_text: [{ type: "text", text: { content: content.slice(0, 2000) } }] };
}

function selectOptions(names: string[]): { select: { options: Array<{ name: string }> } } {
  return { select: { options: names.map((name) => ({ name })) } };
}

function schemaProperties(type: string, cfg: TypeConfig): Record<string, unknown> {
  const status = cfg.enums.status ?? [];
  const props: Record<string, unknown> = {
    Name: { title: {} },
    "Pilotbook ID": { rich_text: {} },
    Status: selectOptions(status),
    Tags: { multi_select: { options: [] } },
  };
  if (hasField(cfg, "priority") && cfg.enums.priority) {
    props.Priority = selectOptions(cfg.enums.priority);
  }
  if (hasField(cfg, "estimate")) props.Estimate = { number: {} };
  if (hasField(cfg, "phase")) props.Phase = { number: {} };
  if (hasField(cfg, "owner")) props.Owner = { rich_text: {} };
  if (hasField(cfg, "impact")) props.Impact = selectOptions([...SIZE]);
  if (hasField(cfg, "effort")) props.Effort = selectOptions([...SIZE]);
  if (hasField(cfg, "version")) props.Version = { number: {} };
  if (hasField(cfg, "date")) props.Date = { date: {} };
  if (hasField(cfg, "deciders")) props.Deciders = { rich_text: {} };
  if (hasField(cfg, "domain")) props.Domain = { rich_text: {} };
  if (cfg.parent) props["Parent ID"] = { rich_text: {} };
  if (type === "story" || type === "task" || type === "epic") {
    props["Depends on IDs"] = { rich_text: {} };
  }
  return props;
}

function relationPatches(
  databases: Record<string, NotionDatabaseRef>,
): Record<string, Record<string, unknown>> {
  const patch: Record<string, Record<string, unknown>> = {};
  const ds = (t: string) => databases[t]?.dataSourceId;
  if (ds("story") && ds("epic")) {
    patch.story = { Parent: { relation: { data_source_id: ds("epic") } } };
  }
  if (ds("task") && ds("story")) {
    patch.task = { Parent: { relation: { data_source_id: ds("story") } } };
  }
  for (const t of ["epic", "story", "task"] as const) {
    if (ds(t)) {
      patch[t] = { ...patch[t], "Depends on": { relation: { data_source_id: ds(t) } } };
    }
  }
  if (ds("story") && ds("business-rule")) {
    patch.story = {
      ...patch.story,
      "Business rules": { relation: { data_source_id: ds("business-rule") } },
    };
  }
  if (ds("story") && ds("adr")) {
    patch.story = { ...patch.story, ADRs: { relation: { data_source_id: ds("adr") } } };
  }
  if (ds("adr")) {
    patch.adr = { ...patch.adr, Supersedes: { relation: { data_source_id: ds("adr") } } };
  }
  return patch;
}

function bodyBlocks(markdown: string): unknown[] {
  const text = markdown.trim() || " ";
  const chunks = text.match(/[\s\S]{1,1900}/g) ?? [" "];
  return chunks.slice(0, 50).map((chunk) => ({
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content: chunk } }] },
  }));
}

function pageProperties(item: ParsedItem, cfg: TypeConfig): Record<string, unknown> {
  const props: Record<string, unknown> = {
    Name: titleProp(String(item.data.title ?? item.data.id)),
    "Pilotbook ID": richTextProp(item.data.id),
  };
  if (item.data.status) props.Status = { select: { name: String(item.data.status) } };
  const tags = asList(item.data.tags);
  if (tags.length) props.Tags = { multi_select: tags.map((name) => ({ name })) };
  if (hasField(cfg, "priority") && item.data.priority) {
    props.Priority = { select: { name: String(item.data.priority) } };
  }
  if (hasField(cfg, "estimate") && typeof item.data.estimate === "number") {
    props.Estimate = { number: item.data.estimate };
  }
  if (hasField(cfg, "phase") && typeof item.data.phase === "number") {
    props.Phase = { number: item.data.phase };
  }
  if (hasField(cfg, "owner") && item.data.owner)
    props.Owner = richTextProp(String(item.data.owner));
  if (hasField(cfg, "impact") && item.data.impact) {
    props.Impact = { select: { name: String(item.data.impact) } };
  }
  if (hasField(cfg, "effort") && item.data.effort) {
    props.Effort = { select: { name: String(item.data.effort) } };
  }
  if (hasField(cfg, "version") && typeof item.data.version === "number") {
    props.Version = { number: item.data.version };
  }
  if (hasField(cfg, "date") && item.data.date) {
    props.Date = { date: { start: String(item.data.date) } };
  }
  if (hasField(cfg, "deciders"))
    props.Deciders = richTextProp(asList(item.data.deciders).join(", "));
  if (hasField(cfg, "domain") && item.data.domain)
    props.Domain = richTextProp(String(item.data.domain));
  if (cfg.parent && item.data[cfg.parent]) {
    props["Parent ID"] = richTextProp(String(item.data[cfg.parent]));
  }
  if (hasField(cfg, "depends_on")) {
    props["Depends on IDs"] = richTextProp(asList(item.data.depends_on).join(", "));
  }
  return props;
}

function relationProperties(
  item: ParsedItem,
  cfg: TypeConfig,
  map: NotionMapFile,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const rel = (ids: string[]) => ({
    relation: ids
      .map((id) => map.pages[id]?.pageId)
      .filter(Boolean)
      .map((id) => ({ id })),
  });
  if (cfg.parent) {
    const parentId = item.data[cfg.parent];
    if (typeof parentId === "string" && map.pages[parentId]?.pageId) {
      props.Parent = rel([parentId]);
    }
  }
  const depends = asList(item.data.depends_on);
  if (depends.length) props["Depends on"] = rel(depends);
  const rules = asList(item.data.business_rules);
  if (rules.length) props["Business rules"] = rel(rules);
  const adrs = asList(item.data.adrs);
  if (adrs.length) props.ADRs = rel(adrs);
  const supersedes = asList(item.data.supersedes);
  if (supersedes.length) props.Supersedes = rel(supersedes);
  return props;
}

function notionScalars(page: NotionPage): {
  title: string;
  id: string;
  status?: string;
  owner?: string;
  priority?: string;
  tags: string[];
  estimate?: number;
  phase?: number;
} {
  const p = page.properties ?? {};
  const estimate = p.Estimate?.number;
  const phase = p.Phase?.number;
  return {
    title: textOf(p.Name, "title"),
    id: textOf(p["Pilotbook ID"], "rich_text").trim(),
    status: p.Status?.select?.name,
    owner: textOf(p.Owner, "rich_text") || undefined,
    priority: p.Priority?.select?.name,
    tags: (p.Tags?.multi_select ?? []).map((x) => x.name ?? "").filter(Boolean),
    estimate: typeof estimate === "number" ? estimate : undefined,
    phase: typeof phase === "number" ? phase : undefined,
  };
}

class NotionHttp {
  readonly writes: string[] = [];
  constructor(
    private token: string,
    private version: string,
    private fetchFn: FetchLike,
  ) {}

  private isWrite(method: string, path: string): boolean {
    if (method === "GET") return false;
    if (method === "POST" && path.includes("/query")) return false;
    return method === "POST" || method === "PATCH" || method === "DELETE";
  }

  async request(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
    if (this.isWrite(method, path)) this.writes.push(`${method} ${path}`);
    const res = await this.fetchFn(`${NOTION_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "Notion-Version": this.version,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      throw new PilotbookError(
        `Notion ${method} ${path} failed: ${res.status}${json.message ? ` ${json.message}` : ""}`,
      );
    }
    return json;
  }
}

function refsFromCreate(json: Record<string, unknown>): NotionDatabaseRef {
  const id = String(json.id ?? "");
  const sources = json.data_sources as Array<{ id?: string }> | undefined;
  const initial = json.initial_data_source as { id?: string } | undefined;
  const dataSourceId = String(sources?.[0]?.id ?? initial?.id ?? id);
  if (!id) throw new PilotbookError("Notion database create returned no id");
  return { id, dataSourceId };
}

function requireToken(
  cfg: NotionInteropConfig | undefined,
  env: Record<string, string | undefined>,
): { token: string; notion: NotionInteropConfig } {
  if (!cfg?.parentPageId) {
    throw new PilotbookError(
      "interop.notion.parent_page_id must be set to sync",
      "missing-config",
      400,
      "Set interop.notion.parent_page_id in pilotbook.config.yml",
    );
  }
  const tokenName = cfg.tokenEnv || "NOTION_TOKEN";
  const token = env[tokenName];
  if (!token) {
    throw new PilotbookError(
      `${tokenName} must be set to sync`,
      "missing-token",
      400,
      `export ${tokenName}=...`,
    );
  }
  return { token, notion: cfg };
}

function allDatabases(cfg: NotionInteropConfig | undefined): Record<string, NotionDatabaseRef> {
  const out: Record<string, NotionDatabaseRef> = {};
  for (const type of NOTION_TYPE_ORDER) {
    const ref = cfg?.databases[type];
    if (ref) out[type] = ref;
  }
  return out;
}

function provisioned(cfg: NotionInteropConfig | undefined): boolean {
  return NOTION_TYPE_ORDER.every((t) => cfg?.databases[t]?.id && cfg.databases[t]?.dataSourceId);
}

async function queryAll(http: NotionHttp, ds: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const json = await http.request("POST", `/data_sources/${ds}/query`, body);
    const results = (json.results as NotionPage[] | undefined) ?? [];
    pages.push(...results);
    cursor = json.has_more ? String(json.next_cursor ?? "") : undefined;
    if (!cursor) break;
  } while (cursor);
  return pages;
}

async function queryById(
  http: NotionHttp,
  ds: string,
  id: string,
): Promise<NotionPage | undefined> {
  const json = await http.request("POST", `/data_sources/${ds}/query`, {
    filter: { property: "Pilotbook ID", rich_text: { equals: id } },
    page_size: 1,
  });
  const results = (json.results as NotionPage[] | undefined) ?? [];
  return results[0];
}

async function replaceChildren(http: NotionHttp, pageId: string, markdown: string): Promise<void> {
  const listed = await http.request("GET", `/blocks/${pageId}/children`);
  const kids = (listed.results as Array<{ id?: string }> | undefined) ?? [];
  for (const kid of kids) {
    if (kid.id) await http.request("DELETE", `/blocks/${kid.id}`);
  }
  const children = bodyBlocks(markdown);
  if (children.length) {
    await http.request("PATCH", `/blocks/${pageId}/children`, { children });
  }
}

async function runInit(
  ctx: OpContext,
  http: NotionHttp,
  notion: NotionInteropConfig,
  dryRun: boolean,
  actions: SyncAction[],
): Promise<Record<string, NotionDatabaseRef>> {
  if (provisioned(notion)) {
    for (const type of NOTION_TYPE_ORDER) {
      actions.push({
        action: "skip",
        side: "to",
        id: type,
        type: "database",
        detail: "already provisioned",
      });
    }
    return allDatabases(notion);
  }
  const created: Record<string, NotionDatabaseRef> = { ...allDatabases(notion) };
  for (const type of NOTION_TYPE_ORDER) {
    if (created[type]) {
      actions.push({ action: "skip", side: "to", id: type, type: "database" });
      continue;
    }
    actions.push({ action: "create", side: "to", id: type, type: "database" });
    if (dryRun) continue;
    const cfg = ctx.project.config.types[type];
    if (!cfg) continue;
    const json = await http.request("POST", "/databases", {
      parent: { type: "page_id", page_id: notion.parentPageId },
      title: [{ type: "text", text: { content: DB_TITLES[type] } }],
      initial_data_source: { properties: schemaProperties(type, cfg) },
    });
    created[type] = refsFromCreate(json);
  }
  if (dryRun) return created;
  const patches = relationPatches(created);
  for (const [type, props] of Object.entries(patches)) {
    const ds = created[type]?.dataSourceId;
    if (!ds) continue;
    await http.request("PATCH", `/data_sources/${ds}`, { properties: props });
  }
  const path = ctx.project.configPath;
  if (!path) throw new PilotbookError("no pilotbook.config.yml to persist database ids");
  ctx.fs.writeFile(path, persistNotionDatabases(ctx.fs.readFile(path), created));
  reload(ctx);
  return created;
}

async function pushItems(
  ctx: OpContext,
  http: NotionHttp,
  databases: Record<string, NotionDatabaseRef>,
  dryRun: boolean,
  actions: SyncAction[],
): Promise<void> {
  const map = loadMap(ctx);
  const byType = new Map<string, ParsedItem[]>();
  for (const item of ctx.project.index.items) {
    if (!databases[item.type]) continue;
    const list = byType.get(item.type) ?? [];
    list.push(item);
    byType.set(item.type, list);
  }
  for (const type of NOTION_TYPE_ORDER) {
    const ref = databases[type];
    const items = byType.get(type) ?? [];
    const cfg = ctx.project.config.types[type];
    if (!ref || !cfg) continue;
    for (const item of items) {
      const id = item.data.id;
      let page = map.pages[id] ? ({ id: map.pages[id]!.pageId } as NotionPage) : undefined;
      if (!page && !dryRun) page = await queryById(http, ref.dataSourceId, id);
      const hash = scalarHash(item, cfg);
      if (!page) {
        actions.push({ action: "create", side: "to", id, type });
        if (dryRun) continue;
        const created = await http.request("POST", "/pages", {
          parent: { type: "data_source_id", data_source_id: ref.dataSourceId },
          properties: pageProperties(item, cfg),
          children: bodyBlocks(item.body),
        });
        map.pages[id] = { pageId: String(created.id), pushHash: hash };
      } else if (map.pages[id]?.pushHash === hash) {
        actions.push({ action: "skip", side: "to", id, type, detail: "unchanged" });
      } else {
        actions.push({ action: "update", side: "to", id, type });
        if (dryRun) continue;
        const pageId = page.id;
        await http.request("PATCH", `/pages/${pageId}`, { properties: pageProperties(item, cfg) });
        await replaceChildren(http, pageId, item.body);
        map.pages[id] = { pageId, pushHash: hash };
      }
    }
  }
  if (!dryRun) {
    for (const type of NOTION_TYPE_ORDER) {
      const items = byType.get(type) ?? [];
      const cfg = ctx.project.config.types[type];
      if (!cfg) continue;
      for (const item of items) {
        const pageId = map.pages[item.data.id]?.pageId;
        if (!pageId) continue;
        const rel = relationProperties(item, cfg, map);
        if (Object.keys(rel).length) {
          await http.request("PATCH", `/pages/${pageId}`, { properties: rel });
        }
      }
    }
    saveMap(ctx, map);
  }
}

function pullPatch(
  item: ParsedItem,
  cfg: TypeConfig,
  scalars: ReturnType<typeof notionScalars>,
): { data: Record<string, unknown>; invalid: boolean } {
  const data: Record<string, unknown> = {};
  let invalid = false;
  if (scalars.title && scalars.title !== String(item.data.title ?? "")) data.title = scalars.title;
  if (scalars.status && scalars.status !== String(item.data.status ?? "")) {
    if (cfg.enums.status && !cfg.enums.status.includes(scalars.status)) invalid = true;
    else if (hasField(cfg, "status")) data.status = scalars.status;
  }
  if (
    scalars.owner !== undefined &&
    hasField(cfg, "owner") &&
    scalars.owner !== String(item.data.owner ?? "")
  ) {
    data.owner = scalars.owner;
  }
  if (
    scalars.priority &&
    hasField(cfg, "priority") &&
    scalars.priority !== String(item.data.priority ?? "")
  ) {
    if (cfg.enums.priority && !cfg.enums.priority.includes(scalars.priority)) invalid = true;
    else data.priority = scalars.priority;
  }
  if (hasField(cfg, "tags")) {
    const local = asList(item.data.tags);
    if (scalars.tags.join(",") !== local.join(",")) data.tags = scalars.tags;
  }
  if (
    scalars.estimate !== undefined &&
    hasField(cfg, "estimate") &&
    scalars.estimate !== item.data.estimate
  ) {
    data.estimate = scalars.estimate;
  }
  if (scalars.phase !== undefined && hasField(cfg, "phase") && scalars.phase !== item.data.phase) {
    data.phase = scalars.phase;
  }
  return { data, invalid };
}

async function pullItems(
  ctx: OpContext,
  http: NotionHttp,
  databases: Record<string, NotionDatabaseRef>,
  dryRun: boolean,
  actions: SyncAction[],
): Promise<void> {
  const map = loadMap(ctx);
  for (const type of NOTION_TYPE_ORDER) {
    const ref = databases[type];
    const cfg = ctx.project.config.types[type];
    if (!ref || !cfg) continue;
    const pages = await queryAll(http, ref.dataSourceId);
    for (const page of pages) {
      const scalars = notionScalars(page);
      if (!scalars.id) {
        if (!scalars.title.trim()) {
          actions.push({
            action: "skip",
            side: "from",
            id: page.id,
            type,
            detail: "blank title",
          });
          continue;
        }
        const parentId = textOf(page.properties?.["Parent ID"], "rich_text").trim();
        if (cfg.parent && !(cfg.optional ?? []).includes(cfg.parent)) {
          const parent = parentId ? ctx.project.index.byId.get(parentId) : undefined;
          if (!parent || parent.type !== cfg.parent) {
            actions.push({
              action: "skip",
              side: "from",
              id: page.id,
              type,
              detail: "missing parent",
            });
            continue;
          }
        }
        actions.push({ action: "intake", side: "from", id: page.id, type, detail: scalars.title });
        if (dryRun) continue;
        const created = createItem(ctx, {
          type,
          title: scalars.title,
          ...(cfg.parent && parentId ? { [cfg.parent]: parentId } : {}),
          ...(scalars.status && cfg.enums.status?.includes(scalars.status)
            ? { status: scalars.status }
            : {}),
          ...(scalars.priority && cfg.enums.priority?.includes(scalars.priority)
            ? { priority: scalars.priority }
            : {}),
          ...(scalars.owner && hasField(cfg, "owner") ? { owner: scalars.owner } : {}),
          ...(hasField(cfg, "tags") ? { tags: scalars.tags } : {}),
          ...(scalars.estimate !== undefined && hasField(cfg, "estimate")
            ? { estimate: scalars.estimate }
            : {}),
          ...(scalars.phase !== undefined && hasField(cfg, "phase")
            ? { phase: scalars.phase }
            : {}),
        });
        await http.request("PATCH", `/pages/${page.id}`, {
          properties: { "Pilotbook ID": richTextProp(created.id) },
        });
        const fresh = ctx.project.index.byId.get(created.id);
        map.pages[created.id] = {
          pageId: page.id,
          pushHash: fresh ? scalarHash(fresh, cfg) : "",
        };
        continue;
      }
      const item = ctx.project.index.byId.get(scalars.id);
      if (!item) {
        actions.push({
          action: "skip",
          side: "from",
          id: scalars.id,
          type,
          detail: "unknown Pilotbook ID",
        });
        continue;
      }
      map.pages[item.data.id] ??= { pageId: page.id, pushHash: "" };
      map.pages[item.data.id]!.pageId = page.id;
      const localHash = scalarHash(item, cfg);
      const last = map.pages[item.data.id]?.pushHash ?? "";
      const notionItem: ParsedItem = {
        ...item,
        data: {
          ...item.data,
          title: scalars.title || item.data.title,
          ...(scalars.status ? { status: scalars.status } : {}),
          ...(scalars.owner !== undefined ? { owner: scalars.owner } : {}),
          ...(scalars.priority ? { priority: scalars.priority } : {}),
          tags: scalars.tags,
          ...(scalars.estimate !== undefined ? { estimate: scalars.estimate } : {}),
          ...(scalars.phase !== undefined ? { phase: scalars.phase } : {}),
        },
      };
      const notionHash = scalarHash(notionItem, cfg);
      if (notionHash === localHash) {
        actions.push({ action: "skip", side: "from", id: item.data.id, type, detail: "in sync" });
        continue;
      }
      if (last && localHash !== last && notionHash !== last) {
        actions.push({
          action: "conflict",
          side: "from",
          id: item.data.id,
          type,
          detail: "Pilotbook wins",
        });
        continue;
      }
      const patch = pullPatch(item, cfg, scalars);
      if (!Object.keys(patch.data).length) {
        actions.push({
          action: "skip",
          side: "from",
          id: item.data.id,
          type,
          detail: patch.invalid ? "invalid enum" : "body/relations ignored",
        });
        continue;
      }
      actions.push({ action: "update", side: "from", id: item.data.id, type });
      if (dryRun) continue;
      updateItem(ctx, item.data.id, { data: patch.data });
      const updated = ctx.project.index.byId.get(item.data.id);
      if (updated)
        map.pages[item.data.id] = { pageId: page.id, pushHash: scalarHash(updated, cfg) };
    }
  }
  if (!dryRun) saveMap(ctx, map);
}

export async function syncNotion(ctx: OpContext, opts: SyncOpts = {}): Promise<SyncResult> {
  const dryRun = opts.dryRun !== false;
  const init = Boolean(opts.init);
  const explicit = opts.to === true || opts.from === true;
  const to = explicit ? Boolean(opts.to) : !init;
  const from = explicit ? Boolean(opts.from) : !init;
  const env = opts.env ?? process.env;
  const fetchFn = opts.fetch ?? (globalThis.fetch as FetchLike);
  const { token, notion } = requireToken(notionCfg(ctx.project.config), env);
  const http = new NotionHttp(token, notion.version || "2025-09-03", fetchFn);
  const actions: SyncAction[] = [];
  let databases = allDatabases(notion);
  if (init) {
    databases = await runInit(ctx, http, notionCfg(ctx.project.config) ?? notion, dryRun, actions);
  }
  const live = allDatabases(notionCfg(ctx.project.config));
  const refs = Object.keys(live).length >= NOTION_TYPE_ORDER.length ? live : databases;
  if ((to || from) && Object.keys(refs).length < NOTION_TYPE_ORDER.length && !dryRun) {
    throw new PilotbookError(
      "Notion databases are not provisioned",
      "not-provisioned",
      400,
      "pb sync --init",
    );
  }
  if (from && Object.keys(refs).length) await pullItems(ctx, http, refs, dryRun, actions);
  if (to && Object.keys(refs).length) await pushItems(ctx, http, refs, dryRun, actions);
  return { dryRun, init, to, from, actions, databases: refs };
}

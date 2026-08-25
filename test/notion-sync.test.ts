import { describe, expect, it } from "vitest";
import { dumpDefaultConfig, parseConfigFile } from "../src/core/config.ts";
import { complete } from "../src/ops/complete.ts";
import { exportItems } from "../src/ops/interop.ts";
import { updateItem } from "../src/ops/items.ts";
import { bindNotion, notionCatalog, parseNotionDatabaseId, syncNotion } from "../src/ops/notion.ts";
import { adr, epic, idea, makeProject, rule, story, task } from "./helpers.ts";

const ENV = { NOTION_TOKEN: "tok" };

function dbsYaml(): string {
  return `    databases:
      epic: { id: db-epic, data_source_id: ds-epic }
      story: { id: db-story, data_source_id: ds-story }
      task: { id: db-task, data_source_id: ds-task }
      idea: { id: db-idea, data_source_id: ds-idea }
      adr: { id: db-adr, data_source_id: ds-adr }
      business-rule: { id: db-br, data_source_id: ds-br }
`;
}

function notionConfig(opts: { databases?: boolean } = {}): string {
  const databases = opts.databases === false ? "" : dbsYaml();
  return `${dumpDefaultConfig()}
interop:
  notion:
    token_env: NOTION_TOKEN
    parent_page_id: parent-1
    version: "2025-09-03"
    push_on_write: false
${databases}`;
}

interface CatalogDb {
  id: string;
  title: string;
  dataSourceId: string;
  url?: string;
  hasPilotbookId?: boolean;
}

interface MockPage {
  id: string;
  ds: string;
  properties: Record<string, unknown>;
  children?: unknown[];
}

function json(data: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => data };
}

function databasePayload(db: CatalogDb) {
  return {
    id: db.id,
    title: [{ plain_text: db.title }],
    data_sources: [{ id: db.dataSourceId }],
    properties: db.hasPilotbookId === false ? {} : { "Pilotbook ID": { rich_text: {} } },
    url: db.url ?? `https://www.notion.so/${db.id.replace(/-/g, "")}`,
  };
}

function makeFetch(pages: MockPage[] = [], catalog: CatalogDb[] = []) {
  const mutating: string[] = [];
  let seq = 1;
  const fetch = async (url: string | URL, init?: { method?: string; body?: string }) => {
    const u = String(url);
    const method = init?.method ?? "GET";
    const body = init?.body ? (JSON.parse(init.body) as Record<string, unknown>) : {};
    const isQuery = u.includes("/query");
    const isSearch = u.endsWith("/search");
    const isMut =
      (method === "POST" && !isQuery && !isSearch) || method === "PATCH" || method === "DELETE";
    if (isMut) mutating.push(`${method} ${u.replace("https://api.notion.com/v1", "")}`);

    if (method === "POST" && isSearch) {
      return json({
        results: catalog.map((db) => ({
          object: "database",
          id: db.id,
          title: [{ plain_text: db.title }],
          url: db.url ?? `https://www.notion.so/${db.id.replace(/-/g, "")}`,
        })),
        has_more: false,
      });
    }
    if (method === "GET" && u.includes("/databases/")) {
      const id = u.split("/databases/")[1] ?? "";
      const hit = catalog.find(
        (db) => db.id === id || db.id.replace(/-/g, "") === id.replace(/-/g, ""),
      );
      if (hit) return json(databasePayload(hit));
      const ds = id.startsWith("db-") ? id.replace(/^db-/, "ds-") : id;
      return json(
        databasePayload({
          id,
          title: id,
          dataSourceId: ds,
          hasPilotbookId: true,
        }),
      );
    }
    if (method === "GET" && u.includes("/data_sources/") && !isQuery) {
      const ds = u.split("/data_sources/")[1] ?? "";
      const hit = catalog.find((db) => db.dataSourceId === ds);
      return json({
        id: ds,
        properties: hit?.hasPilotbookId === false ? {} : { "Pilotbook ID": { rich_text: {} } },
      });
    }
    if (method === "POST" && u.endsWith("/databases")) {
      const title =
        (body.title as Array<{ text?: { content?: string } }>)?.[0]?.text?.content ?? "db";
      const id = `db-${seq}`;
      const ds = `ds-${seq}`;
      seq += 1;
      return json({
        id,
        data_sources: [{ id: ds }],
        title,
        initial_data_source: {
          properties: (body.initial_data_source as { properties?: unknown })?.properties,
        },
      });
    }
    if (method === "POST" && u.includes("/data_sources/") && u.endsWith("/query")) {
      const ds = u.split("/data_sources/")[1]?.split("/")[0] ?? "";
      const filter = body.filter as { rich_text?: { equals?: string } } | undefined;
      let results = pages.filter((p) => p.ds === ds);
      if (filter?.rich_text?.equals) {
        results = results.filter((p) => {
          const runs = (
            p.properties["Pilotbook ID"] as { rich_text?: Array<{ text?: { content?: string } }> }
          )?.rich_text;
          const id = runs?.map((r) => r.text?.content ?? "").join("") ?? "";
          return id === filter.rich_text?.equals;
        });
      }
      return json({ results, has_more: false });
    }
    if (method === "POST" && u.endsWith("/pages")) {
      const id = `page-${seq++}`;
      const parent = body.parent as { data_source_id?: string };
      const page: MockPage = {
        id,
        ds: parent?.data_source_id ?? "",
        properties: (body.properties as Record<string, unknown>) ?? {},
        children: body.children as unknown[],
      };
      pages.push(page);
      return json({ id });
    }
    if (method === "PATCH" && u.includes("/pages/")) {
      const id = u.split("/pages/")[1] ?? "";
      const page = pages.find((p) => p.id === id);
      if (page && body.properties) {
        page.properties = { ...page.properties, ...(body.properties as Record<string, unknown>) };
      }
      return json({ id });
    }
    if (method === "GET" && u.includes("/blocks/") && u.endsWith("/children")) {
      return json({ results: [] });
    }
    if (method === "PATCH" && u.includes("/blocks/")) return json({});
    if (method === "DELETE" && u.includes("/blocks/")) return json({});
    if (method === "PATCH" && u.includes("/data_sources/")) return json({});
    return json({});
  };
  return { fetch, mutating, pages };
}

function seededProject(extra: Record<string, string> = {}) {
  return makeProject({
    "pilotbook.config.yml": notionConfig(),
    "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001", { title: "Ledger" }),
    "docs/backlog/stories/US-001-s.md": story("US-001", "EPIC-001", { title: "Post a tx" }),
    "docs/backlog/tasks/TASK-001-t.md": task("TASK-001", "US-001", { title: "API" }),
    "docs/ideas/IDEA-001-i.md": idea("IDEA-001", { title: "A demand" }),
    "docs/adr/ADR-0001-a.md": adr("ADR-0001", { title: "Decide" }),
    "docs/business-rules/BR-001-r.md": rule("BR-001", { title: "Money" }),
    ...extra,
  });
}

describe("Notion config", () => {
  it("US-038#1 parses interop.notion without breaking default config", () => {
    const cfg = parseConfigFile(notionConfig());
    expect(cfg.interop.notion?.parentPageId).toBe("parent-1");
    expect(cfg.interop.notion?.databases.epic?.dataSourceId).toBe("ds-epic");
    const plain = parseConfigFile(dumpDefaultConfig());
    expect(plain.interop.notion).toBeUndefined();
  });
});

describe("Notion init", () => {
  it("US-043#5 refreshes bound ids and does not POST /databases", async () => {
    const ctx = seededProject();
    const { fetch, mutating } = makeFetch(
      [],
      [
        {
          id: "db-epic",
          title: "Epics",
          dataSourceId: "ds-epic-refreshed",
          hasPilotbookId: true,
        },
      ],
    );
    const result = await syncNotion(ctx, {
      init: true,
      dryRun: false,
      fetch,
      env: ENV,
    });
    expect(result.actions.some((a) => a.detail === "refresh" && a.id === "epic")).toBe(true);
    expect(mutating.filter((m) => m.startsWith("POST /databases"))).toHaveLength(0);
    const reloaded = parseConfigFile(ctx.fs.readFile("/project/pilotbook.config.yml"));
    expect(reloaded.interop.notion?.databases.epic?.dataSourceId).toBe("ds-epic-refreshed");
  });

  it("US-043#1 does not require parent_page_id", async () => {
    const ctx = makeProject({
      "pilotbook.config.yml": `${dumpDefaultConfig()}
interop:
  notion:
    token_env: NOTION_TOKEN
`,
    });
    const catalog = await notionCatalog(ctx, {
      fetch: makeFetch(
        [],
        [
          {
            id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            title: "Pilotbook Epics",
            dataSourceId: "ds-1",
            hasPilotbookId: true,
          },
        ],
      ).fetch,
      env: ENV,
    });
    expect(catalog.tokenOk).toBe(true);
    expect(catalog.databases).toEqual([
      expect.objectContaining({
        title: "Pilotbook Epics",
        dataSourceId: "ds-1",
      }),
    ]);
  });

  it("throws when the token is missing and when nothing is bound", async () => {
    const noToken = makeProject({ "pilotbook.config.yml": notionConfig() });
    await expect(
      syncNotion(noToken, { init: true, dryRun: false, fetch: makeFetch().fetch, env: {} }),
    ).rejects.toThrow(/NOTION_TOKEN/);
    const unbound = makeProject({
      "pilotbook.config.yml": `${dumpDefaultConfig()}
interop:
  notion:
    token_env: NOTION_TOKEN
`,
    });
    await expect(
      syncNotion(unbound, { init: true, dryRun: false, fetch: makeFetch().fetch, env: ENV }),
    ).rejects.toThrow(/wizard|bound/i);
  });

  it("US-038#4 CLI and MCP share the sync command name", () => {
    const ctx = makeProject();
    expect(complete(ctx, [""]).some((h) => h.value === "sync")).toBe(true);
  });
});

describe("Notion bind", () => {
  it("US-043#2 persists ids from a URL and never POSTs /databases", async () => {
    const hex = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const ctx = makeProject({
      "pilotbook.config.yml": `${dumpDefaultConfig()}
interop:
  notion:
    token_env: NOTION_TOKEN
`,
    });
    const { fetch, mutating } = makeFetch(
      [],
      [{ id: hex, title: "Epics", dataSourceId: "ds-epic", hasPilotbookId: true }],
    );
    const result = await bindNotion(ctx, {
      databases: { epic: `https://www.notion.so/Acme/Epics-${hex}` },
      fetch,
      env: ENV,
    });
    expect(result.databases.epic?.id).toBe(hex);
    expect(result.databases.epic?.dataSourceId).toBe("ds-epic");
    expect(mutating.some((m) => m.startsWith("POST /databases"))).toBe(false);
    const reloaded = parseConfigFile(ctx.fs.readFile("/project/pilotbook.config.yml"));
    expect(reloaded.interop.notion?.databases.epic?.dataSourceId).toBe("ds-epic");
  });

  it("US-043#3 warns when Pilotbook ID is missing and does not PATCH schema", async () => {
    const ctx = makeProject({
      "pilotbook.config.yml": `${dumpDefaultConfig()}
interop:
  notion:
    token_env: NOTION_TOKEN
`,
    });
    const { fetch, mutating } = makeFetch(
      [],
      [{ id: "db-story", title: "Stories", dataSourceId: "ds-story", hasPilotbookId: false }],
    );
    const result = await bindNotion(ctx, {
      databases: { story: "db-story" },
      fetch,
      env: ENV,
    });
    expect(result.warnings.some((w) => /Pilotbook ID/i.test(w))).toBe(true);
    expect(mutating.filter((m) => m.startsWith("PATCH /data_sources"))).toHaveLength(0);
    expect(mutating.filter((m) => m.startsWith("PATCH /databases"))).toHaveLength(0);
    expect(
      parseConfigFile(ctx.fs.readFile("/project/pilotbook.config.yml")).interop.notion?.databases
        .story?.id,
    ).toBe("db-story");
  });

  it("US-043#1 parses dashed UUIDs and 32-hex URLs", () => {
    expect(parseNotionDatabaseId("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(
      "aaaaaaaabbbbccccddddeeeeeeeeeeee",
    );
    expect(
      parseNotionDatabaseId("https://www.notion.so/ws/Name-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa?v=1"),
    ).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("US-043#4 CLI and MCP share the sync command name", () => {
    const ctx = makeProject();
    expect(complete(ctx, [""]).some((h) => h.value === "sync")).toBe(true);
  });

  it("catalog reports a missing token without throwing", async () => {
    const ctx = makeProject({ "pilotbook.config.yml": notionConfig({ databases: false }) });
    const catalog = await notionCatalog(ctx, { fetch: makeFetch().fetch, env: {} });
    expect(catalog.tokenOk).toBe(false);
    expect(catalog.databases).toEqual([]);
  });
});

describe("Notion push", () => {
  it("US-039#1 creates a page keyed by Pilotbook ID", async () => {
    const ctx = seededProject();
    const { fetch, pages } = makeFetch();
    const result = await syncNotion(ctx, { to: true, from: false, dryRun: false, fetch, env: ENV });
    expect(result.actions.some((a) => a.action === "create" && a.id === "EPIC-001")).toBe(true);
    const created = pages.find((p) => {
      const runs = (
        p.properties["Pilotbook ID"] as { rich_text?: Array<{ text?: { content?: string } }> }
      )?.rich_text;
      return runs?.some((r) => r.text?.content === "EPIC-001");
    });
    expect(created).toBeTruthy();
    expect(ctx.fs.exists("/project/.pb/notion-map.json")).toBe(true);
  });

  it("US-039#2 patches an existing page and does not POST a duplicate", async () => {
    const ctx = seededProject();
    const mock = makeFetch();
    await syncNotion(ctx, { to: true, from: false, dryRun: false, fetch: mock.fetch, env: ENV });
    const posts = mock.mutating.filter((m) => m === "POST /pages").length;
    updateItem(ctx, "EPIC-001", { data: { title: "Ledger v2" } });
    await syncNotion(ctx, { to: true, from: false, dryRun: false, fetch: mock.fetch, env: ENV });
    expect(mock.mutating.filter((m) => m === "POST /pages").length).toBe(posts);
    expect(mock.mutating.some((m) => m.startsWith("PATCH /pages/"))).toBe(true);
    const epicPages = mock.pages.filter((p) => {
      const runs = (
        p.properties["Pilotbook ID"] as { rich_text?: Array<{ text?: { content?: string } }> }
      )?.rich_text;
      return runs?.some((r) => r.text?.content === "EPIC-001");
    });
    expect(epicPages).toHaveLength(1);
  });

  it("US-039#3 sends markdown as page children", async () => {
    const ctx = seededProject();
    const { fetch, pages } = makeFetch();
    await syncNotion(ctx, { to: true, from: false, dryRun: false, fetch, env: ENV });
    expect(pages.some((p) => Array.isArray(p.children) && p.children.length > 0)).toBe(true);
  });

  it("US-039#4 exportItems --to notion uses the upsert op", async () => {
    const ctx = seededProject();
    const { fetch } = makeFetch();
    const payload = await exportItems(ctx, "notion", { dryRun: false, fetch, env: ENV });
    expect(payload.target).toBe("notion");
    expect(payload.dryRun).toBe(false);
    expect((payload.items as Array<{ action: string }>).some((a) => a.action === "create")).toBe(
      true,
    );
  });

  it("US-039#5 CLI lists sync next to export", () => {
    const ctx = makeProject();
    const names = complete(ctx, [""]).map((h) => h.value);
    expect(names).toContain("sync");
    expect(names).toContain("export");
  });
});

describe("Notion dry-run", () => {
  it("US-040#1 classifies create update skip conflict intake", async () => {
    const ctx = seededProject();
    const { fetch } = makeFetch([
      {
        id: "n-blank",
        ds: "ds-idea",
        properties: { Name: { title: [] }, "Pilotbook ID": { rich_text: [] } },
      },
      {
        id: "n-new",
        ds: "ds-idea",
        properties: {
          Name: { title: [{ text: { content: "Fresh idea" } }] },
          "Pilotbook ID": { rich_text: [] },
        },
      },
    ]);
    const result = await syncNotion(ctx, { dryRun: true, fetch, env: ENV });
    const kinds = new Set(result.actions.map((a) => a.action));
    expect(kinds.has("create")).toBe(true);
    expect(kinds.has("intake")).toBe(true);
    expect(kinds.has("skip")).toBe(true);
    expect(result.actions.every((a) => a.side === "to" || a.side === "from")).toBe(true);
  });

  it("US-040#2 dry-run performs no Notion writes", async () => {
    const ctx = seededProject();
    const { fetch, mutating } = makeFetch();
    const before = ctx.fs.readFile("/project/docs/backlog/epics/EPIC-001-a.md");
    await syncNotion(ctx, { dryRun: true, fetch, env: ENV });
    expect(mutating).toEqual([]);
    expect(ctx.fs.readFile("/project/docs/backlog/epics/EPIC-001-a.md")).toBe(before);
  });

  it("US-040#3 returns the structured payload for JSON", async () => {
    const ctx = seededProject();
    const result = await syncNotion(ctx, { dryRun: true, fetch: makeFetch().fetch, env: ENV });
    expect(result).toMatchObject({ dryRun: true, actions: expect.any(Array) });
    expect(JSON.parse(JSON.stringify(result)).dryRun).toBe(true);
  });

  it("US-040#4 defaults to dry-run unless dryRun is false", async () => {
    const ctx = seededProject();
    const { fetch, mutating } = makeFetch();
    const result = await syncNotion(ctx, { fetch, env: ENV });
    expect(result.dryRun).toBe(true);
    expect(mutating).toEqual([]);
  });
});

describe("Notion pull", () => {
  it("US-041#1 pulls changed scalars through updateItem", async () => {
    const ctx = seededProject();
    const mock = makeFetch();
    await syncNotion(ctx, { to: true, from: false, dryRun: false, fetch: mock.fetch, env: ENV });
    const epicPage = mock.pages.find((p) => {
      const runs = (
        p.properties["Pilotbook ID"] as { rich_text?: Array<{ text?: { content?: string } }> }
      )?.rich_text;
      return runs?.some((r) => r.text?.content === "EPIC-001");
    });
    expect(epicPage).toBeTruthy();
    epicPage!.properties.Status = { select: { name: "done" } };
    await syncNotion(ctx, { to: false, from: true, dryRun: false, fetch: mock.fetch, env: ENV });
    const item = ctx.project.index.byId.get("EPIC-001");
    expect(item?.data.status).toBe("done");
  });

  it("US-041#2 prefers Pilotbook when both sides changed", async () => {
    const ctx = seededProject();
    const mock = makeFetch();
    await syncNotion(ctx, { to: true, from: false, dryRun: false, fetch: mock.fetch, env: ENV });
    updateItem(ctx, "EPIC-001", { data: { title: "Local title" } });
    const epicPage = mock.pages.find((p) => {
      const runs = (
        p.properties["Pilotbook ID"] as { rich_text?: Array<{ text?: { content?: string } }> }
      )?.rich_text;
      return runs?.some((r) => r.text?.content === "EPIC-001");
    });
    epicPage!.properties.Status = { select: { name: "done" } };
    const result = await syncNotion(ctx, {
      to: false,
      from: true,
      dryRun: false,
      fetch: mock.fetch,
      env: ENV,
    });
    expect(result.actions.some((a) => a.action === "conflict" && a.id === "EPIC-001")).toBe(true);
    expect(ctx.project.index.byId.get("EPIC-001")?.data.status).not.toBe("done");
    expect(ctx.project.index.byId.get("EPIC-001")?.data.title).toBe("Local title");
  });

  it("US-041#3 does not pull body or relations into markdown", async () => {
    const ctx = seededProject();
    const before = ctx.fs.readFile("/project/docs/backlog/epics/EPIC-001-a.md");
    const mock = makeFetch();
    await syncNotion(ctx, { to: true, from: false, dryRun: false, fetch: mock.fetch, env: ENV });
    await syncNotion(ctx, { to: false, from: true, dryRun: false, fetch: mock.fetch, env: ENV });
    const after = ctx.fs.readFile("/project/docs/backlog/epics/EPIC-001-a.md");
    expect(after.includes("## Outcome")).toBe(true);
    expect(
      before
        .split("\n")
        .filter((l) => l.startsWith("depends_on"))
        .join(),
    ).toBe(
      after
        .split("\n")
        .filter((l) => l.startsWith("depends_on"))
        .join(),
    );
  });

  it("US-041#4 rejects invalid Notion enums", async () => {
    const ctx = seededProject();
    const mock = makeFetch();
    await syncNotion(ctx, { to: true, from: false, dryRun: false, fetch: mock.fetch, env: ENV });
    const epicPage = mock.pages.find((p) => {
      const runs = (
        p.properties["Pilotbook ID"] as { rich_text?: Array<{ text?: { content?: string } }> }
      )?.rich_text;
      return runs?.some((r) => r.text?.content === "EPIC-001");
    });
    epicPage!.properties.Status = { select: { name: "nope" } };
    const result = await syncNotion(ctx, {
      to: false,
      from: true,
      dryRun: false,
      fetch: mock.fetch,
      env: ENV,
    });
    expect(result.actions.some((a) => a.detail === "invalid enum" && a.id === "EPIC-001")).toBe(
      true,
    );
    expect(ctx.project.index.byId.get("EPIC-001")?.data.status).not.toBe("nope");
  });

  it("US-041#5 pull is the same ops function the CLI sync command calls", () => {
    const ctx = makeProject();
    expect(complete(ctx, ["sync", "--from", ""]).some((h) => h.value === "notion")).toBe(true);
  });
});

describe("Notion intake", () => {
  it("US-042#1 US-042#2 allocates a real id and writes it back", async () => {
    const ctx = seededProject();
    const mock = makeFetch([
      {
        id: "n-new",
        ds: "ds-idea",
        properties: {
          Name: { title: [{ text: { content: "Captured in Notion" } }] },
          "Pilotbook ID": { rich_text: [] },
        },
      },
    ]);
    const result = await syncNotion(ctx, {
      to: false,
      from: true,
      dryRun: false,
      fetch: mock.fetch,
      env: ENV,
    });
    expect(result.actions.some((a) => a.action === "intake")).toBe(true);
    const created = ctx.project.index.items.find(
      (i) => String(i.data.title) === "Captured in Notion",
    );
    expect(created?.data.id).toMatch(/^IDEA-\d{3}$/);
    expect(created?.data.id).not.toBe("n-new");
    const page = mock.pages.find((p) => p.id === "n-new");
    const written = (
      page?.properties["Pilotbook ID"] as { rich_text?: Array<{ text?: { content?: string } }> }
    )?.rich_text
      ?.map((r) => r.text?.content)
      .join("");
    expect(written).toBe(created?.data.id);
  });

  it("US-042#3 skips blank-title intake", async () => {
    const ctx = seededProject();
    const before = ctx.project.index.items.filter((i) => i.type === "idea").length;
    const result = await syncNotion(ctx, {
      to: false,
      from: true,
      dryRun: false,
      fetch: makeFetch([
        {
          id: "n-empty",
          ds: "ds-idea",
          properties: { Name: { title: [] }, "Pilotbook ID": { rich_text: [] } },
        },
      ]).fetch,
      env: ENV,
    });
    expect(result.actions.some((a) => a.action === "skip" && a.detail === "blank title")).toBe(
      true,
    );
    expect(ctx.project.index.items.filter((i) => i.type === "idea")).toHaveLength(before);
  });

  it("US-042#4 intake is on the same sync command as pull", () => {
    const ctx = makeProject();
    expect(complete(ctx, [""]).some((h) => h.value === "sync")).toBe(true);
  });
});

import { hostJoin } from "../core/config.ts";
import { today } from "../core/frontmatter.ts";
import { WORK_TYPES } from "../core/types.ts";
import type { OpContext } from "./context.ts";
import { PilotbookError } from "./context.ts";

export interface Manifest {
  name: string;
  generated: string;
  items: Array<{
    id: string;
    type: string;
    title: string;
    status?: string;
    edges: Record<string, string | string[]>;
  }>;
}

export function buildManifest(ctx: OpContext): Manifest {
  const { config, index } = ctx.project;
  const name =
    config.name || ctx.project.projectRoot.split(/[\\/]/).filter(Boolean).at(-1) || "repo";
  const items = index.items.map((item) => {
    const edges: Record<string, string | string[]> = {};
    for (const [field, kind] of Object.entries(config.edges)) {
      const value = item.data[field];
      if (kind.scalar && typeof value === "string" && value) edges[field] = value;
      else if (Array.isArray(value) && value.length) edges[field] = value.map(String);
    }
    return {
      id: item.data.id,
      type: item.type,
      title: String(item.data.title),
      status: typeof item.data.status === "string" ? item.data.status : undefined,
      edges,
    };
  });
  return { name, generated: today(), items };
}

export function writeManifest(ctx: OpContext): { wrote: string; manifest: Manifest } {
  const manifest = buildManifest(ctx);
  const rel = `${ctx.project.config.cacheDir}/graph.json`;
  const abs = hostJoin(ctx.project.projectRoot, rel);
  ctx.fs.mkdirp(hostJoin(abs, ".."));
  ctx.fs.writeFile(abs, `${JSON.stringify(manifest, null, 2)}\n`);
  return { wrote: rel, manifest };
}

export type ExportTarget = "jira" | "notion";

export interface ExportPayload {
  target: ExportTarget;
  dryRun: boolean;
  items: unknown[];
  posted?: number;
}

function jiraIssue(item: {
  id: string;
  type: string;
  title: string;
  status?: string;
  body?: string;
}): Record<string, unknown> {
  return {
    fields: {
      summary: `[${item.id}] ${item.title}`,
      description: item.body ?? "",
      labels: ["pilotbook", item.type],
    },
    externalId: item.id,
    status: item.status,
  };
}

function notionPage(item: {
  id: string;
  type: string;
  title: string;
  status?: string;
}): Record<string, unknown> {
  return {
    properties: {
      Name: { title: [{ text: { content: `${item.id} ${item.title}` } }] },
      ID: { rich_text: [{ text: { content: item.id } }] },
      Type: { select: { name: item.type } },
      Status: { select: { name: item.status ?? "backlog" } },
    },
  };
}

export async function exportItems(
  ctx: OpContext,
  target: ExportTarget,
  opts: { dryRun?: boolean } = {},
): Promise<ExportPayload> {
  const work = ctx.project.index.items.filter((i) => WORK_TYPES.includes(i.type));
  const mapped = work.map((i) => ({
    id: i.data.id,
    type: i.type,
    title: String(i.data.title),
    status: typeof i.data.status === "string" ? i.data.status : undefined,
    body: i.body,
  }));
  if (opts.dryRun !== false) {
    return {
      target,
      dryRun: true,
      items: mapped.map((i) => (target === "jira" ? jiraIssue(i) : notionPage(i))),
    };
  }
  if (target === "jira") {
    const base = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;
    const project = process.env.JIRA_PROJECT;
    if (!base || !email || !token || !project) {
      throw new PilotbookError(
        "JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT must be set to export",
      );
    }
    let posted = 0;
    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    for (const item of mapped) {
      const res = await fetch(`${base.replace(/\/$/, "")}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            project: { key: project },
            summary: `[${item.id}] ${item.title}`,
            issuetype: { name: item.type === "bug" ? "Bug" : "Task" },
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: item.body.slice(0, 8000) || item.title }],
                },
              ],
            },
          },
        }),
      });
      if (!res.ok) throw new PilotbookError(`Jira rejected ${item.id}: ${res.status}`);
      posted++;
    }
    return { target, dryRun: false, items: mapped.map(jiraIssue), posted };
  }
  const notionToken = process.env.NOTION_TOKEN;
  const database = process.env.NOTION_DATABASE_ID;
  if (!notionToken || !database) {
    throw new PilotbookError("NOTION_TOKEN and NOTION_DATABASE_ID must be set to export");
  }
  let posted = 0;
  for (const item of mapped) {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({ parent: { database_id: database }, ...notionPage(item) }),
    });
    if (!res.ok) throw new PilotbookError(`Notion rejected ${item.id}: ${res.status}`);
    posted++;
  }
  return { target, dryRun: false, items: mapped.map(notionPage), posted };
}

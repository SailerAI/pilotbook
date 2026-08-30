import { stdin as input, stdout as output } from "node:process";
import {
  analyzeGraph,
  applyClarifications,
  bindNotion,
  board,
  boardPlan,
  briefOf,
  bumpItem,
  clarifyItem,
  convergeItem,
  createItem,
  deleteItem,
  explain,
  exportItems,
  generateSkill,
  getItem,
  graphDot,
  groundDemand,
  impactOf,
  initProject,
  instructionsOverview,
  lint,
  listItems,
  listReady,
  nextReady,
  notionCatalog,
  type OpContext,
  PilotbookError,
  parseTypeFilter,
  profileOf,
  promoteIdea,
  rejectIdea,
  schemaOf,
  searchGraph,
  seedFromBrief,
  similarItems,
  skillOf,
  splitItem,
  statusOf,
  syncNotion,
  updateItem,
  verifyItem,
  withProject,
  writeManifest,
} from "../ops/index.ts";

interface RpcReq {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
}

function reply(id: number | string | null | undefined, result: unknown): void {
  output.write(`${JSON.stringify({ jsonrpc: "2.0", id: id ?? null, result })}\n`);
}

/** Same error shape the CLI's `fail()` prints — the `fix` a PilotbookError carries survives
 * the transport (US-069 AC4) instead of collapsing to a bare message. */
export function errorPayload(err: unknown): { code: number; message: string; fix?: string } {
  const message = err instanceof Error ? err.message : String(err);
  const fix = err instanceof PilotbookError ? err.fix : undefined;
  return fix ? { code: -32000, message, fix } : { code: -32000, message };
}

function replyErr(
  id: number | string | null | undefined,
  message: string,
  code = -32000,
  fix?: string,
): void {
  const error: { code: number; message: string; fix?: string } = { code, message };
  if (fix) error.fix = fix;
  output.write(`${JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error })}\n`);
}

const TOOLS = [
  {
    name: "lint",
    description: "Lint the Pilotbook graph",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "brief",
    description: "Compile a brief for an item",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, budget: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "next",
    description: "Unblocked work items",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "status",
    description: "Computed ready/blocked state with requires, missingDeps, and unlocks",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Item ID; omit for the ready list" } },
    },
  },
  {
    name: "search",
    description: "Search item ids, titles, and bodies",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        type: { type: "string", description: "Comma-separated types" },
      },
      required: ["q"],
    },
  },
  {
    name: "similar",
    description: "Rank items by title-then-body token overlap",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        type: { type: "string", description: "Comma-separated types" },
      },
      required: ["q"],
    },
  },
  {
    name: "profile",
    description: "Derived repo maturity and calibration hints",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "ground",
    description: "Map a demand onto codeMap paths and live items",
    inputSchema: {
      type: "object",
      properties: { q: { type: "string" } },
      required: ["q"],
    },
  },
  {
    name: "generate",
    description: "Run a shipped skill with an exported LLM token (optional fallback)",
    inputSchema: {
      type: "object",
      properties: {
        skill: { type: "string" },
        title: { type: "string" },
        demand: { type: "string" },
      },
      required: ["skill", "title", "demand"],
    },
  },
  {
    name: "list_items",
    description: "List all items",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_item",
    description: "Get one item",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "create_item",
    description: "Create an item",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string" },
        title: { type: "string" },
        epic: { type: "string" },
        story: { type: "string" },
      },
      required: ["type", "title"],
    },
  },
  {
    name: "update_item",
    description: "Patch an item",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, data: { type: "object" }, body: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "delete_item",
    description: "Delete an item",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "explain",
    description: "Explain blockers",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "verify",
    description: "Run verification checks",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, force: { type: "boolean" } },
      required: ["id"],
    },
  },
  { name: "schema", description: "Type schema", inputSchema: { type: "object", properties: {} } },
  {
    name: "promote",
    description: "Promote an idea to an epic or story",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        to: { type: "string", description: "epic | story" },
        title: { type: "string" },
        epic: { type: "string" },
        dryRun: { type: "boolean" },
      },
      required: ["id", "to", "title"],
    },
  },
  {
    name: "bump",
    description: "Increment version and refresh content_hash on a business rule or ADR",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "impact",
    description: "List stories and tasks that cite a business rule or ADR",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "analyze",
    description: "Report graph coverage gaps without an LLM",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "converge",
    description: "Append tasks for uncovered acceptance criteria",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        dryRun: { type: "boolean" },
      },
      required: ["id"],
    },
  },
  {
    name: "split",
    description: "Split an oversized item into children",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        dryRun: { type: "boolean" },
        epic: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "reject",
    description: "Record a kill verdict on an idea",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, reason: { type: "string" } },
      required: ["id", "reason"],
    },
  },
  {
    name: "clarify",
    description: "Detect or apply a bounded clarification set",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        answers: { type: "array", items: { type: "object" } },
      },
      required: ["id"],
    },
  },
  {
    name: "instructions",
    description: "List shipped Pilotbook skills with one-line descriptions",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "skill",
    description: "Return one shipped skill body and frontmatter",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Skill name (e.g. implement)" } },
      required: ["name"],
    },
  },
  {
    name: "sync",
    description: "Two-way Notion sync: catalog or bind databases, then push, pull, and intake",
    inputSchema: {
      type: "object",
      properties: {
        catalog: { type: "boolean", description: "List searchable Notion databases" },
        bind: {
          type: "object",
          description: "Map of Pilotbook type to database id or URL",
          additionalProperties: { type: "string" },
        },
        init: { type: "boolean", description: "Refresh bound database ids" },
        to: { type: "boolean", description: "Push markdown to Notion" },
        from: { type: "boolean", description: "Pull Notion into markdown" },
        dryRun: { type: "boolean" },
      },
    },
  },
  {
    name: "board",
    description: "Regenerate BOARD.md, or report a dry-run plan of added/orphan ids",
    inputSchema: {
      type: "object",
      properties: { dryRun: { type: "boolean", description: "Report without writing" } },
    },
  },
  {
    name: "graph",
    description: "Render the graph as Graphviz DOT",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "seed",
    description: "Materialize a brief's markdown into epics, stories, and tasks",
    inputSchema: {
      type: "object",
      properties: {
        markdown: { type: "string", description: "Brief markdown ('# Epic: …', '## Story: …')" },
        dryRun: { type: "boolean" },
      },
      required: ["markdown"],
    },
  },
  {
    name: "export",
    description: "One-way export to Jira or Notion",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "jira | notion" },
        dryRun: { type: "boolean" },
      },
      required: ["to"],
    },
  },
  {
    name: "manifest",
    description: "Write .pb/graph.json for cross-repo refs",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "init",
    description: "Scaffold config, directories, templates, and agent wiring",
    inputSchema: {
      type: "object",
      properties: {
        ai: { type: "boolean", description: "Install agent skills/rules", default: true },
        refreshSkills: {
          type: "boolean",
          description: "Overwrite shipped skills that were not locally edited",
        },
        hosts: {
          type: "array",
          items: { type: "string" },
          description: "Hosts to install (cursor, claude, agents, codex). Omit to auto-detect.",
        },
      },
    },
  },
];

export const MCP_TOOLS: ReadonlyArray<{ name: string; description: string; inputSchema: object }> =
  TOOLS;

function textResult(obj: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }],
  };
}

export function callTool(
  ctx: OpContext,
  name: string,
  params: Record<string, unknown>,
): unknown | Promise<unknown> {
  switch (name) {
    case "lint":
      return textResult(lint(ctx));
    case "brief": {
      const r = briefOf(ctx, String(params.id), {
        budget: typeof params.budget === "number" ? params.budget : undefined,
      });
      return textResult(r.text);
    }
    case "next":
      return textResult(nextReady(ctx));
    case "status":
      if (params.id == null || params.id === "") {
        return textResult({ items: listReady(ctx) });
      }
      return textResult(statusOf(ctx, String(params.id)));
    case "search": {
      const type = parseTypeFilter(
        typeof params.type === "string" ? params.type : undefined,
        Object.keys(ctx.project.config.types),
      );
      return textResult(searchGraph(ctx, String(params.q ?? ""), { type }));
    }
    case "similar": {
      const type = parseTypeFilter(
        typeof params.type === "string" ? params.type : undefined,
        Object.keys(ctx.project.config.types),
        "pb similar <q> --type",
      );
      return textResult(similarItems(ctx, String(params.q ?? ""), { type }));
    }
    case "profile":
      return textResult(profileOf(ctx));
    case "ground":
      return textResult(groundDemand(ctx, String(params.q ?? "")));
    case "generate":
      return generateSkill(ctx, {
        skill: String(params.skill ?? ""),
        title: String(params.title ?? ""),
        demand: String(params.demand ?? ""),
      }).then((result) => textResult(result));
    case "list_items":
      return textResult(listItems(ctx));
    case "get_item":
      return textResult(getItem(ctx, String(params.id)));
    case "create_item":
      return textResult(createItem(ctx, params as { type: string; title: string }));
    case "update_item":
      return textResult(
        updateItem(ctx, String(params.id), {
          data: (params.data as Record<string, unknown>) ?? {},
          body: typeof params.body === "string" ? params.body : undefined,
        }),
      );
    case "delete_item":
      return textResult(deleteItem(ctx, String(params.id)));
    case "explain":
      return textResult(explain(ctx, String(params.id)));
    case "verify":
      return textResult(verifyItem(ctx, String(params.id), { force: Boolean(params.force) }));
    case "schema":
      return textResult(schemaOf(ctx));
    case "promote": {
      const to = String(params.to);
      if (to !== "epic" && to !== "story") {
        throw new PilotbookError("to must be epic or story", "invalid-to");
      }
      return textResult(
        promoteIdea(ctx, String(params.id), {
          to,
          title: String(params.title ?? ""),
          epic: typeof params.epic === "string" ? params.epic : undefined,
          dryRun: Boolean(params.dryRun),
        }),
      );
    }
    case "bump":
      return textResult(bumpItem(ctx, String(params.id)));
    case "impact":
      return textResult(impactOf(ctx, String(params.id)));
    case "analyze":
      return textResult(analyzeGraph(ctx));
    case "converge":
      return textResult(convergeItem(ctx, String(params.id), { dryRun: Boolean(params.dryRun) }));
    case "split":
      return textResult(
        splitItem(ctx, String(params.id), {
          dryRun: Boolean(params.dryRun),
          epic: typeof params.epic === "string" ? params.epic : undefined,
        }),
      );
    case "reject":
      return textResult(
        rejectIdea(ctx, String(params.id), { reason: String(params.reason ?? "") }),
      );
    case "clarify":
      if (params.answers != null) {
        return textResult(applyClarifications(ctx, String(params.id), params.answers));
      }
      return textResult(clarifyItem(ctx, String(params.id)));
    case "instructions":
      return textResult(instructionsOverview());
    case "skill":
      return textResult(skillOf(String(params.name ?? "")));
    case "sync": {
      if (params.catalog) {
        return notionCatalog(ctx).then((result) => textResult(result));
      }
      if (params.bind != null && params.bind !== false) {
        return bindNotion(ctx, { databases: params.bind }).then((result) => textResult(result));
      }
      const explicit = params.to === true || params.from === true;
      return syncNotion(ctx, {
        init: Boolean(params.init),
        ...(explicit ? { to: Boolean(params.to), from: Boolean(params.from) } : {}),
        dryRun: params.dryRun !== false,
      }).then((result) => textResult(result));
    }
    case "board":
      return textResult(params.dryRun ? boardPlan(ctx) : board(ctx));
    case "graph":
      return textResult({ dot: graphDot(ctx) });
    case "seed":
      return textResult(
        seedFromBrief(ctx, String(params.markdown ?? ""), { dryRun: Boolean(params.dryRun) }),
      );
    case "export": {
      const to = params.to === "notion" ? "notion" : "jira";
      return exportItems(ctx, to, { dryRun: params.dryRun !== false }).then((result) =>
        textResult(result),
      );
    }
    case "manifest":
      return textResult(writeManifest(ctx));
    case "init":
      return textResult(
        initProject(
          ctx.project.projectRoot,
          {
            ai: params.ai !== false,
            refreshSkills: Boolean(params.refreshSkills),
            hosts: Array.isArray(params.hosts) ? params.hosts.map(String) : undefined,
          },
          ctx.fs,
        ),
      );
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

export async function runMcp(cwd?: string): Promise<void> {
  const ctx = withProject(cwd);
  input.setEncoding("utf8");
  let buf = "";
  let chain = Promise.resolve();
  input.on("data", (chunk: string) => {
    buf += chunk;
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const line of parts) {
      if (!line.trim()) continue;
      let req: RpcReq;
      try {
        req = JSON.parse(line) as RpcReq;
      } catch {
        continue;
      }
      const id = req.id;
      chain = chain.then(async () => {
        try {
          if (req.method === "initialize") {
            reply(id, {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "pilotbook", version: "0.0.0" },
            });
          } else if (req.method === "notifications/initialized") {
            // no-op
          } else if (req.method === "tools/list") {
            reply(id, { tools: TOOLS });
          } else if (req.method === "tools/call") {
            const name = String(req.params?.name ?? "");
            const args = (req.params?.arguments as Record<string, unknown>) ?? {};
            reply(id, await callTool(ctx, name, args));
          } else if (req.method === "ping") {
            reply(id, {});
          } else {
            replyErr(id, `unknown method ${req.method}`, -32601);
          }
        } catch (err) {
          const payload = errorPayload(err);
          replyErr(id, payload.message, payload.code, payload.fix);
        }
      });
    }
  });
  await new Promise<void>((resolve) => input.on("end", resolve));
  await chain;
}

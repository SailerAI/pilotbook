import { stdin as input, stdout as output } from "node:process";
import {
  briefOf,
  createItem,
  deleteItem,
  explain,
  getItem,
  lint,
  listItems,
  nextReady,
  type OpContext,
  schemaOf,
  updateItem,
  verifyItem,
  withProject,
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

function replyErr(id: number | string | null | undefined, message: string, code = -32000): void {
  output.write(`${JSON.stringify({ jsonrpc: "2.0", id: id ?? null, error: { code, message } })}\n`);
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
];

function textResult(obj: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2) }],
  };
}

function callTool(ctx: OpContext, name: string, params: Record<string, unknown>): unknown {
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
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

export async function runMcp(cwd?: string): Promise<void> {
  const ctx = withProject(cwd);
  input.setEncoding("utf8");
  let buf = "";
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
          reply(id, callTool(ctx, name, args));
        } else if (req.method === "ping") {
          reply(id, {});
        } else {
          replyErr(id, `unknown method ${req.method}`, -32601);
        }
      } catch (err) {
        replyErr(id, err instanceof Error ? err.message : String(err));
      }
    }
  });
  await new Promise<void>((resolve) => input.on("end", resolve));
}

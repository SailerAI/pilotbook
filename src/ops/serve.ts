import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type OpContext, PilotbookError, withProject } from "./context.ts";
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  schemaOf,
  updateItem,
  writeBoard,
} from "./items.ts";
import { briefOf, graphDot, lint, nextReady } from "./query.ts";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

function uiDir(): string {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const candidates = [path.resolve(here, "../../ui"), path.resolve(here, "../../../ui")];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "index.html"))) return c;
  }
  return candidates[0]!;
}

function send(res: http.ServerResponse, status: number, body: unknown, type?: string): void {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  const ct =
    type ??
    (typeof body === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8");
  res.writeHead(status, { "Content-Type": ct, "Cache-Control": "no-store" });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new PilotbookError("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(urlPath: string, res: http.ServerResponse, dir: string): void {
  let rel = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  if (rel === "/") rel = "/index.html";
  const abs = path.normalize(path.join(dir, rel));
  if (!abs.startsWith(dir)) {
    send(res, 403, { error: "forbidden" });
    return;
  }
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    send(res, 404, { error: "not found" });
    return;
  }
  const ext = path.extname(abs);
  res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
  fs.createReadStream(abs).pipe(res);
}

async function handleApi(
  ctx: OpContext,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
): Promise<void> {
  const route = url.pathname.replace(/\/$/, "") || "/";
  try {
    if (req.method === "GET" && route === "/api/schema") {
      send(res, 200, schemaOf(ctx));
      return;
    }
    if (req.method === "GET" && route === "/api/items") {
      send(res, 200, listItems(ctx));
      return;
    }
    if (req.method === "GET" && route === "/api/lint") {
      send(res, 200, lint(ctx));
      return;
    }
    if (req.method === "GET" && route === "/api/next") {
      send(res, 200, { items: nextReady(ctx) });
      return;
    }
    if (req.method === "GET" && route === "/api/graph.dot") {
      send(res, 200, graphDot(ctx), "text/vnd.graphviz; charset=utf-8");
      return;
    }
    if (req.method === "POST" && route === "/api/board") {
      send(res, 200, { wrote: writeBoard(ctx) });
      return;
    }
    if (req.method === "POST" && route === "/api/items") {
      const body = await readBody(req);
      send(res, 201, createItem(ctx, body as { type: string; title: string }));
      return;
    }
    const briefMatch = route.match(/^\/api\/brief\/([^/]+)$/);
    if (briefMatch && req.method === "GET") {
      const id = decodeURIComponent(briefMatch[1]!);
      const result = briefOf(ctx, id);
      send(res, 200, { ...result.brief, markdown: result.text });
      return;
    }
    const itemMatch = route.match(/^\/api\/items\/([^/]+)$/);
    if (itemMatch) {
      const id = decodeURIComponent(itemMatch[1]!);
      if (req.method === "GET") {
        send(res, 200, getItem(ctx, id));
        return;
      }
      if (req.method === "PATCH") {
        const body = await readBody(req);
        send(
          res,
          200,
          updateItem(ctx, id, body as { data?: Record<string, unknown>; body?: string }),
        );
        return;
      }
      if (req.method === "DELETE") {
        send(res, 200, deleteItem(ctx, id));
        return;
      }
    }
    send(res, 404, { error: "not found" });
  } catch (err) {
    const status = err instanceof PilotbookError ? err.status : 400;
    send(res, status, { error: err instanceof Error ? err.message : String(err) });
  }
}

export function startUi(opts: { port?: number; cwd?: string } = {}): http.Server {
  const port = opts.port ?? Number(process.env.PILOTBOOK_UI_PORT || 4173);
  const ctx = withProject(opts.cwd);
  const dir = uiDir();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      handleApi(ctx, req, res, url).catch((err) => {
        send(res, 500, { error: err instanceof Error ? err.message : String(err) });
      });
      return;
    }
    serveStatic(url.pathname, res, dir);
  });
  server.listen(port, "127.0.0.1");
  return server;
}

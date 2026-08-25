import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyClarifications, clarifyItem } from "./clarify.ts";
import { type OpContext, PilotbookError, reload, withProject } from "./context.ts";
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  schemaOf,
  updateItem,
  writeBoard,
} from "./items.ts";
import { bindNotion, notionCatalog } from "./notion.ts";
import { briefOf, graphDot, lint, listReady, nextReady, searchGraph, statusOf } from "./query.ts";
import { watchProject } from "./watch.ts";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

/** Walk up from this module until we find the installed/source package root. */
export function findPackageRoot(
  startDir: string = path.dirname(fileURLToPath(import.meta.url)),
): string {
  let dir = startDir;
  while (true) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { name?: string };
        if (pkg.name === "pilotbook") return dir;
      } catch {
        // keep walking
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("could not locate the pilotbook package root (package.json)");
}

export function uiDir(): string {
  const root = findPackageRoot();
  const dir = path.join(root, "ui");
  if (!fs.existsSync(path.join(dir, "index.html"))) {
    throw new Error(`Pilotbook UI files missing at ${dir}`);
  }
  return dir;
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
  const root = dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`;
  if (!abs.startsWith(root) && abs !== dir) {
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

function startSse(req: http.IncomingMessage, res: http.ServerResponse): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(":\n\n");
  req.socket.setTimeout(0);
}

function pushEvent(clients: Set<http.ServerResponse>, payload: unknown): void {
  const frame = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(frame);
    } catch {
      clients.delete(client);
    }
  }
}

async function handleApi(
  ctx: OpContext,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  sse: Set<http.ServerResponse>,
): Promise<void> {
  const route = url.pathname.replace(/\/$/, "") || "/";
  try {
    if (req.method === "GET" && route === "/api/events") {
      startSse(req, res);
      sse.add(res);
      req.on("close", () => sse.delete(res));
      return;
    }
    reload(ctx);
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
    if (req.method === "GET" && route === "/api/status") {
      send(res, 200, { items: listReady(ctx) });
      return;
    }
    const statusMatch = route.match(/^\/api\/status\/([^/]+)$/);
    if (statusMatch && req.method === "GET") {
      send(res, 200, statusOf(ctx, decodeURIComponent(statusMatch[1]!)));
      return;
    }
    if (req.method === "GET" && route === "/api/search") {
      send(res, 200, { items: searchGraph(ctx, url.searchParams.get("q") ?? "") });
      return;
    }
    if (req.method === "GET" && route === "/api/graph.dot") {
      send(res, 200, graphDot(ctx), "text/vnd.graphviz; charset=utf-8");
      return;
    }
    if (req.method === "GET" && route === "/api/notion") {
      send(res, 200, await notionCatalog(ctx));
      return;
    }
    if (req.method === "PUT" && route === "/api/notion") {
      const body = await readBody(req);
      send(res, 200, await bindNotion(ctx, { databases: body.databases ?? body }));
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
    if (req.method === "POST" && route === "/api/intake") {
      const body = await readBody(req);
      const title = String(body.title ?? "").trim();
      if (!title) throw new PilotbookError("title is required");
      const item = createItem(ctx, { type: "idea", title });
      const clarify = clarifyItem(ctx, item.id);
      send(res, 201, { item, clarify });
      return;
    }
    const clarifyMatch = route.match(/^\/api\/items\/([^/]+)\/clarify$/);
    if (clarifyMatch && req.method === "POST") {
      const id = decodeURIComponent(clarifyMatch[1]!);
      const body = await readBody(req);
      if (body.answers != null) {
        send(res, 200, applyClarifications(ctx, id, body.answers));
      } else {
        send(res, 200, clarifyItem(ctx, id));
      }
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
    const payload: Record<string, unknown> = {
      error: err instanceof Error ? err.message : String(err),
    };
    if (err instanceof PilotbookError) {
      payload.code = err.code;
      if (err.fix) payload.fix = err.fix;
    }
    send(res, status, payload);
  }
}

export function startUi(opts: { port?: number; cwd?: string } = {}): http.Server {
  const port = opts.port ?? Number(process.env.PILOTBOOK_UI_PORT || 4173);
  const ctx = withProject(opts.cwd);
  const dir = path.resolve(uiDir());
  const sse = new Set<http.ServerResponse>();
  const disk = watchProject(
    ctx.project.projectRoot,
    ctx.project.config,
    ctx.project.configPath,
    () => {
      reload(ctx);
      pushEvent(sse, { type: "reload" });
    },
  );
  const ping = setInterval(() => {
    for (const client of sse) {
      try {
        client.write(":\n\n");
      } catch {
        sse.delete(client);
      }
    }
  }, 25_000);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      handleApi(ctx, req, res, url, sse).catch((err) => {
        send(res, 500, { error: err instanceof Error ? err.message : String(err) });
      });
      return;
    }
    serveStatic(url.pathname, res, dir);
  });
  const stop = (): void => {
    clearInterval(ping);
    disk.close();
    for (const client of sse) {
      try {
        client.end();
      } catch {
        /* ignore */
      }
    }
    sse.clear();
  };
  server.on("close", stop);
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      err.message = `port ${port} is already in use. Try \`pb ui --port 4174\` or stop the other process.`;
    }
  });
  server.listen(port, "127.0.0.1");
  return server;
}

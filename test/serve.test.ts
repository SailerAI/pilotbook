import { once } from "node:events";
import fs from "node:fs";
import type http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { findPackageRoot, startUi, uiDir } from "../src/ops/serve.ts";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(pkgRoot, "test/fixtures/healthy");

describe("ui path", () => {
  it("finds the package root from a nested dist module", () => {
    expect(findPackageRoot(path.join(pkgRoot, "dist/ops"))).toBe(pkgRoot);
    expect(findPackageRoot(path.join(pkgRoot, "dist/cli"))).toBe(pkgRoot);
  });

  it("resolves ui/index.html from the package, not a sibling of Projects", () => {
    const dir = uiDir();
    expect(dir).toBe(path.join(pkgRoot, "ui"));
    expect(dir).not.toContain(`${path.sep}Projects${path.sep}ui`);
  });
});

describe("startUi", () => {
  let server: http.Server | undefined;

  afterEach(async () => {
    if (!server) return;
    server.close();
    await once(server, "close").catch(() => undefined);
    server = undefined;
  });

  it("serves the board HTML and API from the bundled ui directory", async () => {
    server = startUi({ port: 0, cwd: fixture });
    await once(server, "listening");
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("expected a TCP address");
    const base = `http://127.0.0.1:${addr.port}`;

    const page = await fetch(`${base}/`);
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("Pilotbook");
    expect(html).toContain("./styles.css");

    const css = await fetch(`${base}/styles.css`);
    expect(css.status).toBe(200);

    const items = await fetch(`${base}/api/items`);
    expect(items.status).toBe(200);
    const body = (await items.json()) as { items: unknown[] };
    expect(body.items.length).toBeGreaterThan(0);

    const schema = await fetch(`${base}/api/schema`);
    expect(schema.status).toBe(200);
    const sch = (await schema.json()) as { types: Record<string, { parent?: string }> };
    expect(sch.types.story?.parent).toBe("epic");
    expect(sch.types.task?.parent).toBe("story");

    const status = await fetch(`${base}/api/status/TASK-001`);
    expect(status.status).toBe(200);
    const statusBody = (await status.json()) as {
      id: string;
      state: string;
      requires: unknown[];
      missingDeps: unknown[];
      unlocks: unknown[];
    };
    expect(statusBody.id).toBe("TASK-001");
    expect(statusBody.state).toBe("ready");
    expect(statusBody.requires).toEqual([]);
    expect(Array.isArray(statusBody.missingDeps)).toBe(true);
    expect(Array.isArray(statusBody.unlocks)).toBe(true);

    const readyList = await fetch(`${base}/api/status`);
    expect(readyList.status).toBe(200);
    const readyBody = (await readyList.json()) as { items: Array<{ id: string }> };
    expect(readyBody.items.some((i) => i.id === "TASK-001")).toBe(true);

    const search = await fetch(`${base}/api/search?q=${encodeURIComponent("Transaction")}`);
    expect(search.status).toBe(200);
    const hits = (await search.json()) as { items: Array<{ id: string; snippet: string }> };
    expect(hits.items.some((h) => h.id === "TASK-001")).toBe(true);

    const empty = await fetch(`${base}/api/search?q=`);
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({ items: [] });
  });

  it("creates an idea from intake and writes clarifications back", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pb-serve-"));
    fs.cpSync(fixture, dir, { recursive: true });
    server = startUi({ port: 0, cwd: dir });
    await once(server, "listening");
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("expected a TCP address");
    const base = `http://127.0.0.1:${addr.port}`;

    const intake = await fetch(`${base}/api/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "I want a better dashboard" }),
    });
    expect(intake.status).toBe(201);
    const created = (await intake.json()) as {
      item: { id: string; type: string; data: { title: string } };
      clarify: { ready: boolean; questions: Array<{ id: string }> };
    };
    expect(created.item.type).toBe("idea");
    expect(created.item.data.title).toBe("I want a better dashboard");
    expect(created.clarify.ready).toBe(false);
    expect(created.clarify.questions.length).toBeGreaterThan(0);

    const detect = await fetch(`${base}/api/items/${created.item.id}/clarify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(detect.status).toBe(200);
    const detected = (await detect.json()) as { questions: Array<{ id: string }> };
    expect(detected.questions.map((q) => q.id)).toEqual(created.clarify.questions.map((q) => q.id));

    const answers = created.clarify.questions.map((q) => ({
      question: q.id,
      option: "open-question",
      text: `Pin ${q.id}`,
    }));
    const applied = await fetch(`${base}/api/items/${created.item.id}/clarify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    expect(applied.status).toBe(200);
    const result = (await applied.json()) as { item: { body: string }; applied: unknown[] };
    expect(result.applied.length).toBe(created.clarify.questions.length);
    expect(result.item.body).toContain("Pin why");

    server.close();
    await once(server, "close").catch(() => undefined);
    server = undefined;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("GET /api/items reflects markdown edited on disk", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pb-serve-"));
    fs.cpSync(fixture, dir, { recursive: true });
    server = startUi({ port: 0, cwd: dir });
    await once(server, "listening");
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("expected a TCP address");
    const base = `http://127.0.0.1:${addr.port}`;

    const storyPath = path.join(dir, "docs/backlog/stories/US-001-post-a-transaction.md");
    const before = (await (await fetch(`${base}/api/items`)).json()) as {
      items: Array<{ id: string; data: { status?: string } }>;
    };
    expect(before.items.find((i) => i.id === "US-001")?.data.status).toBe("todo");

    fs.writeFileSync(
      storyPath,
      fs.readFileSync(storyPath, "utf8").replace("status: todo", "status: done"),
    );

    const after = (await (await fetch(`${base}/api/items`)).json()) as {
      items: Array<{ id: string; data: { status?: string } }>;
    };
    expect(after.items.find((i) => i.id === "US-001")?.data.status).toBe("done");

    server.close();
    await once(server, "close").catch(() => undefined);
    server = undefined;
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("GET /api/events notifies after a disk write", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pb-serve-"));
    fs.cpSync(fixture, dir, { recursive: true });
    server = startUi({ port: 0, cwd: dir });
    await once(server, "listening");
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("expected a TCP address");
    const base = `http://127.0.0.1:${addr.port}`;

    const ac = new AbortController();
    const stream = await fetch(`${base}/api/events`, { signal: ac.signal });
    expect(stream.status).toBe(200);
    expect(stream.headers.get("content-type")).toMatch(/text\/event-stream/);
    const reader = stream.body?.getReader();
    expect(reader).toBeTruthy();

    const storyPath = path.join(dir, "docs/backlog/stories/US-001-post-a-transaction.md");
    fs.writeFileSync(
      storyPath,
      fs.readFileSync(storyPath, "utf8").replace("status: todo", "status: done"),
    );

    const decoder = new TextDecoder();
    let buf = "";
    const deadline = Date.now() + 5000;
    while (!buf.includes("reload") && Date.now() < deadline) {
      const chunk = await Promise.race([
        reader!.read(),
        new Promise<{ done: true; value: undefined }>((resolve) =>
          setTimeout(() => resolve({ done: true, value: undefined }), 200),
        ),
      ]);
      if (chunk.value) buf += decoder.decode(chunk.value, { stream: true });
    }
    ac.abort();
    expect(buf).toContain("reload");

    server.close();
    await once(server, "close").catch(() => undefined);
    server = undefined;
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

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
});

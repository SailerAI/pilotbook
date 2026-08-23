import { once } from "node:events";
import type http from "node:http";
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
  });
});

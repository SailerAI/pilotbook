import { describe, expect, it } from "vitest";
import { builtinTypes, extraKeys } from "../src/core/defaults.ts";
import { parseFrontmatter, serializeItem } from "../src/core/frontmatter.ts";
import { bodyHash } from "../src/core/hash.ts";
import { bumpItem } from "../src/ops/bump.ts";
import { createItem } from "../src/ops/items.ts";
import { lint } from "../src/ops/query.ts";
import { adr, hashedBody, makeProject, rule } from "./helpers.ts";

describe("content_hash schema and bump", () => {
  it("defaults version to 1 and stamps content_hash on new adr", () => {
    const ctx = makeProject();
    const created = createItem(ctx, { type: "adr", title: "Pick a store" });
    expect(created.data.version).toBe(1);
    expect(created.data.content_hash).toBe(bodyHash(created.body));
  });

  it("round-trips a hashed adr", () => {
    const text = adr("ADR-0001");
    const parsed = parseFrontmatter(text, "x.md");
    const cfg = builtinTypes().adr!;
    const out = serializeItem(parsed.data, parsed.body, cfg.required, extraKeys(cfg));
    expect(parseFrontmatter(out, "y.md").data).toEqual(parsed.data);
  });

  it("errors when an accepted ADR body drifts", () => {
    const body = "## Context\n\nA.\n\n## Decision\n\nB.\n";
    const ctx = makeProject({
      "docs/adr/ADR-0001-a.md": adr("ADR-0001", {}, body),
    });
    const item = ctx.project.index.byId.get("ADR-0001")!;
    ctx.fs.writeFile(
      item.abs,
      adr("ADR-0001", { content_hash: "deadbeefdead" }, `${body}\nchanged\n`),
    );
    const ctx2 = makeProject({
      "docs/adr/ADR-0001-a.md": ctx.fs.readFile(item.abs),
    });
    const err = lint(ctx2).errors.find((e) => e.code === "stale-content-hash");
    expect(err).toBeTruthy();
    expect(err?.fix).toBe("pb bump ADR-0001");
  });

  it("bumps version, amended, and hash; second bump is a no-op", () => {
    const body = "## Context\n\nA.\n\n## Decision\n\nB.\n";
    const stale = adr("ADR-0001", { content_hash: "deadbeefdead" }, `${body}more\n`);
    const ctx = makeProject({ "docs/adr/ADR-0001-a.md": stale });
    const first = bumpItem(ctx, "ADR-0001");
    expect(first.bumped).toBe(true);
    if (!first.bumped) throw new Error("expected bump");
    expect(first.version).toBe(2);
    expect(first.amended).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const item = ctx.project.index.byId.get("ADR-0001")!;
    expect(item.data.content_hash).toBe(bodyHash(item.body));
    expect(lint(ctx).errors.some((e) => e.code === "stale-content-hash")).toBe(false);

    const before = ctx.fs.readFile(item.abs);
    const second = bumpItem(ctx, "ADR-0001");
    expect(second.bumped).toBe(false);
    if (second.bumped) throw new Error("expected warning");
    expect(second.warning).toMatch(/unchanged/i);
    expect(ctx.fs.readFile(item.abs)).toBe(before);
  });

  it("does not treat a matching hash as drift", () => {
    const body = "## Rule\n\nMUST.\n";
    const ctx = makeProject({
      "docs/business-rules/BR-001-r.md": rule("BR-001", {}, body),
    });
    expect(lint(ctx).errors).toEqual([]);
    expect(bodyHash(hashedBody(body))).toBeTruthy();
  });
});

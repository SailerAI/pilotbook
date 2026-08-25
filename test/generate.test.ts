import { describe, expect, it } from "vitest";
import { PilotbookError } from "../src/ops/context.ts";
import { generateSkill } from "../src/ops/generate.ts";
import { epic, makeProject } from "./helpers.ts";

const IDEA_MD = `## Why

Builders need a researched idea.

## Jobs to be done

When I say I want a dashboard I want a filled idea.

## Personas

Builder.

## Sketch

An idea file with evidence.

## Prior art

Spec Kit — https://github.com/github/spec-kit/

## Evidence

https://github.com/github/spec-kit/

## Open questions

- None

## Why not now

Ready.
`;

describe("generateSkill", () => {
  it("creates an idea through createItem when ANTHROPIC_API_KEY is set", async () => {
    const ctx = makeProject({
      "docs/backlog/epics/EPIC-001-a.md": epic("EPIC-001"),
    });
    const fetchMock: typeof fetch = async () =>
      new Response(JSON.stringify({ content: [{ text: IDEA_MD }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    const result = await generateSkill(ctx, {
      skill: "discover",
      title: "Ops dashboard",
      demand: "I want an ops dashboard",
      fetch: fetchMock,
      env: { ANTHROPIC_API_KEY: "sk-test" },
    });
    expect(result.item.id).toMatch(/^IDEA-/);
    expect(result.provider).toBe("anthropic");
    const created = ctx.project.index.byId.get(result.item.id);
    expect(created?.body).toContain("## Prior art");
    expect(created?.body).toContain("github.com/github/spec-kit");
  });

  it("refuses without a token and points at skills", async () => {
    const ctx = makeProject();
    await expect(
      generateSkill(ctx, {
        skill: "discover",
        title: "X",
        demand: "Y",
        env: {},
      }),
    ).rejects.toMatchObject({
      code: "missing-llm-token",
    });
    try {
      await generateSkill(ctx, { skill: "discover", title: "X", demand: "Y", env: {} });
    } catch (err) {
      expect(err).toBeInstanceOf(PilotbookError);
      expect((err as PilotbookError).fix).toContain("pb skill discover");
    }
  });

  it("refuses skills other than discover", async () => {
    const ctx = makeProject();
    await expect(
      generateSkill(ctx, {
        skill: "shape",
        title: "X",
        demand: "Y",
        env: { ANTHROPIC_API_KEY: "sk" },
      }),
    ).rejects.toMatchObject({ code: "unsupported-generate" });
  });
});

import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CommandDef } from "citty";
import { runCommand } from "citty";
import { describe, expect, it, vi } from "vitest";
import { main } from "../src/cli/index.ts";
import { callTool, errorPayload, MCP_TOOLS } from "../src/mcp/index.ts";
import { coverageGaps, EXEMPT, parityGaps } from "../src/ops/capabilities.ts";
import { PilotbookError, withProject } from "../src/ops/context.ts";
import { SHIPPED_SKILLS } from "../src/ops/init.ts";
import { skillOf } from "../src/ops/instructions.ts";
import { profileOf } from "../src/ops/profile.ts";
import { statusOf } from "../src/ops/query.ts";

const FIXTURE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "fixtures/healthy");

function cliCommands(): Record<string, CommandDef> {
  return (main.subCommands ?? {}) as Record<string, CommandDef>;
}

function cliNames(): string[] {
  return Object.keys(cliCommands());
}

function mcpNames(): string[] {
  return MCP_TOOLS.map((t) => t.name);
}

function skillCommands() {
  return SHIPPED_SKILLS.map((name) => {
    const skill = skillOf(name);
    return { name: skill.name, commands: skill.commands };
  });
}

describe("BR-005: MCP parity (US-069)", () => {
  it("every non-exempt CLI command has a same-named MCP tool", () => {
    const { missingMcp } = parityGaps(cliNames(), mcpNames());
    expect(missingMcp, `add an MCP tool in src/mcp/index.ts for: ${missingMcp.join(", ")}`).toEqual(
      [],
    );
  });

  it("every MCP tool maps to a real CLI command", () => {
    const { orphanTools } = parityGaps(cliNames(), mcpNames());
    expect(
      orphanTools,
      `MCP tool has no matching CLI command in src/cli/index.ts: ${orphanTools.join(", ")}`,
    ).toEqual([]);
  });

  it("every non-exempt CLI command declares --json", () => {
    const missing: string[] = [];
    for (const [name, cmd] of Object.entries(cliCommands())) {
      if (name in EXEMPT) continue;
      const args = (cmd.args ?? {}) as Record<string, unknown>;
      if (!("json" in args)) missing.push(name);
    }
    expect(missing, `command missing the json arg: ${missing.join(", ")}`).toEqual([]);
  });

  it("an MCP tool error carries the same fix string the CLI would print", () => {
    const err = new PilotbookError("item not found: NOPE-999", "not-found", 404, "pb search NOPE");
    const cliPayload = {
      error: err.message,
      code: err.code,
      ...(err.fix ? { fix: err.fix } : {}),
    };
    const mcpPayload = errorPayload(err);
    expect(mcpPayload.fix).toBe(cliPayload.fix);
    expect(mcpPayload.message).toBe(cliPayload.error);
  });

  it("golden case: profile returns identical data through the CLI and MCP", async () => {
    const ctx = withProject(FIXTURE);
    const direct = profileOf(ctx);
    const mcpResult = callTool(ctx, "profile", {}) as {
      content: Array<{ type: "text"; text: string }>;
    };
    const viaMcp = JSON.parse(mcpResult.content[0]?.text ?? "{}");
    expect(viaMcp).toEqual(direct);

    const writes: string[] = [];
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      writes.push(String(chunk));
      return true;
    });
    try {
      const profileCmd = cliCommands().profile;
      if (!profileCmd) throw new Error("no profile command");
      await runCommand(profileCmd, { rawArgs: ["--cwd", FIXTURE, "--json"] });
    } finally {
      spy.mockRestore();
    }
    const viaCli = JSON.parse(writes.join(""));
    expect(viaCli).toEqual(direct);
  });

  it("golden case: status TASK-001 returns identical data through the CLI and MCP", async () => {
    const ctx = withProject(FIXTURE);
    const direct = statusOf(ctx, "TASK-001");
    const mcpResult = callTool(ctx, "status", { id: "TASK-001" }) as {
      content: Array<{ type: "text"; text: string }>;
    };
    const viaMcp = JSON.parse(mcpResult.content[0]?.text ?? "{}");
    expect(viaMcp).toEqual(direct);

    const writes: string[] = [];
    const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      writes.push(String(chunk));
      return true;
    });
    try {
      const statusCmd = cliCommands().status;
      if (!statusCmd) throw new Error("no status command");
      await runCommand(statusCmd, { rawArgs: ["TASK-001", "--cwd", FIXTURE, "--json"] });
    } finally {
      spy.mockRestore();
    }
    const viaCli = JSON.parse(writes.join(""));
    expect(viaCli).toEqual(direct);
  });
});

describe("BR-005: skill coverage (US-071)", () => {
  it("every non-exempt CLI command is named by at least one shipped skill", () => {
    const { unnamed } = coverageGaps(cliNames(), skillCommands());
    expect(
      unnamed,
      `add "pb ${unnamed.join('", "pb ')}" to a skill's commands: list in skills/*.md`,
    ).toEqual([]);
  });

  it("no shipped skill names a command that does not exist", () => {
    const { phantom } = coverageGaps(cliNames(), skillCommands());
    expect(
      phantom,
      phantom.map((p) => `${p.skill} names non-existent command "pb ${p.command}"`).join("; "),
    ).toEqual([]);
  });
});

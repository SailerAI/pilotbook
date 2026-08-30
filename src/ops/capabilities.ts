/**
 * BR-005 enforcement: every non-exempt capability must be reachable from the CLI, the MCP
 * server, and at least one shipped skill. Nothing here is a registry to keep in sync by hand —
 * `parityGaps` and `coverageGaps` read the CLI command tree, the MCP tool list, and skill
 * frontmatter directly, so a gap is discovered by re-running the check, never by remembering to
 * update a list (that would be the exact drift BR-005 exists to catch).
 */

/**
 * Why a CLI command is not itself an agent-facing capability (BR-005's edge cases). An entry is
 * exempt from all three checks below (MCP parity, --json, skill coverage) for the stated reason —
 * some entries already satisfy a check they're exempt from (e.g. `init` ships an MCP tool anyway);
 * the exemption just means that check can no longer prove a regression for that command.
 */
export type ExemptReason = "transport" | "bootstrap" | "router";

export const EXEMPT: Record<string, ExemptReason> = {
  // BR-005: "ui, mcp, and completions are transports themselves and are exempt from the
  // --json clause." _complete is completions' hidden resolver, same exemption.
  ui: "transport",
  mcp: "transport",
  completions: "transport",
  _complete: "transport",
  // Invoked by a host's session lifecycle, not chosen by an agent mid-task.
  hook: "bootstrap",
  // A skill teaches an agent that can already read skills; init is what installs skills into a
  // repo in the first place, so nothing can tell an agent to run it before it exists.
  init: "bootstrap",
  // ADR-0011: the exported-token LLM fallback for when no agent is open. A skill instructing an
  // agent to run it would be circular — an agent capable of following skills has no need for it.
  generate: "bootstrap",
  // The skill-loading mechanism itself — a skill naming these would be circular.
  instructions: "router",
  skill: "router",
};

export function isExempt(name: string): boolean {
  return name in EXEMPT;
}

/**
 * CLI command name → MCP tool name, for the rare case where the same op is named differently by
 * convention. `pb new` creates any type; the MCP tool is scoped `create_item` to read naturally
 * alongside `get_item`/`update_item`/`delete_item`/`list_items`. Both directions of `parityGaps`
 * consult this so the two names are recognized as one capability rather than flagged as a gap.
 */
export const ALIASES: Record<string, string> = {
  new: "create_item",
  get: "get_item",
  list: "list_items",
  update: "update_item",
  delete: "delete_item",
};

export interface ParityGaps {
  /** Non-exempt CLI commands with no MCP tool (via ALIASES or the same name). */
  missingMcp: string[];
  /** MCP tools no CLI command (directly or via ALIASES) claims. */
  orphanTools: string[];
}

/** US-069: every non-exempt CLI command has an MCP tool, and no tool is orphaned. */
export function parityGaps(cliNames: readonly string[], mcpNames: readonly string[]): ParityGaps {
  const mcp = new Set(mcpNames);
  const resolve = (n: string): string => ALIASES[n] ?? n;
  const claimed = new Set(cliNames.map(resolve));
  return {
    missingMcp: cliNames.filter((n) => !isExempt(n) && !mcp.has(resolve(n))).sort(),
    orphanTools: mcpNames.filter((n) => !claimed.has(n)).sort(),
  };
}

export interface SkillCommands {
  name: string;
  commands: readonly string[];
}

export interface PhantomCommand {
  skill: string;
  command: string;
}

export interface CoverageGaps {
  /** Non-exempt CLI commands no shipped skill names in its `commands:` list. */
  unnamed: string[];
  /** A skill names a command that is not a real CLI command (the US-034 regression). */
  phantom: PhantomCommand[];
}

/** Extract the `pb <name>` command word a skill's `commands:` entry names. */
function commandWord(entry: string): string {
  return (
    entry
      .trim()
      .replace(/^pb\s+/, "")
      .split(/\s+/)[0] ?? ""
  );
}

/**
 * US-071: every non-exempt CLI command is named by at least one skill, in both directions — an
 * op no skill mentions is unreachable, and a skill naming a missing op is a lie already shipped
 * once in this repo (US-034).
 */
export function coverageGaps(
  cliNames: readonly string[],
  skills: readonly SkillCommands[],
): CoverageGaps {
  const cli = new Set(cliNames);
  const named = new Set<string>();
  const phantom: PhantomCommand[] = [];
  for (const skill of skills) {
    for (const raw of skill.commands) {
      const command = commandWord(raw);
      if (!command) continue;
      named.add(command);
      if (!cli.has(command)) phantom.push({ skill: skill.name, command });
    }
  }
  return {
    unnamed: cliNames.filter((n) => !isExempt(n) && !named.has(n)).sort(),
    phantom,
  };
}

import { BACKLOG_STATUS, PRIORITIES } from "../core/types.ts";
import type { OpContext } from "./context.ts";
import { SHIPPED_SKILLS } from "./init.ts";

export interface CompletionHit {
  value: string;
  description?: string;
}

export function complete(ctx: OpContext, args: string[]): CompletionHit[] {
  const last = args[args.length - 1] ?? "";
  const prev = args[args.length - 2] ?? "";
  const commands = [
    "init",
    "new",
    "next",
    "status",
    "brief",
    "lint",
    "board",
    "explain",
    "search",
    "graph",
    "verify",
    "ui",
    "mcp",
    "export",
    "promote",
    "bump",
    "impact",
    "split",
    "reject",
    "clarify",
    "seed",
    "manifest",
    "hook",
    "completions",
    "instructions",
    "skill",
  ];

  if (args.length <= 1) {
    return filter(
      commands.map((c) => ({ value: c })),
      last,
    );
  }
  const cmd = args[0] ?? "";
  if (prev === "--status")
    return filter(
      BACKLOG_STATUS.map((s) => ({ value: s })),
      last,
    );
  if (prev === "--priority")
    return filter(
      PRIORITIES.map((s) => ({ value: s })),
      last,
    );
  if (prev === "--type" || (cmd === "new" && args.length === 2)) {
    return filter(
      Object.keys(ctx.project.config.types).map((t) => ({ value: t })),
      last,
    );
  }
  if (prev === "--epic") {
    return filter(
      ctx.project.index.items
        .filter((i) => i.type === "epic")
        .map((i) => ({ value: i.data.id, description: String(i.data.title) })),
      last,
    );
  }
  if (prev === "--story") {
    return filter(
      ctx.project.index.items
        .filter((i) => i.type === "story")
        .map((i) => ({ value: i.data.id, description: String(i.data.title) })),
      last,
    );
  }
  if (prev === "--to") {
    const values = cmd === "promote" ? ["epic", "story"] : ["jira", "notion"];
    return filter(
      values.map((v) => ({ value: v })),
      last,
    );
  }
  if (cmd === "instructions") {
    return filter([{ value: "overview", description: "List shipped skills" }], last);
  }
  if (cmd === "skill") {
    return filter(
      SHIPPED_SKILLS.map((n) => ({ value: n })),
      last,
    );
  }
  if (cmd === "promote" || cmd === "reject") {
    return filter(
      ctx.project.index.items
        .filter((i) => i.type === "idea")
        .map((i) => ({ value: i.data.id, description: String(i.data.title) })),
      last,
    );
  }
  if (
    ["brief", "explain", "verify", "clarify", "status", "bump", "impact", "split"].includes(cmd) ||
    prev === "<ID>"
  ) {
    return filter(
      ctx.project.index.items.map((i) => ({ value: i.data.id, description: String(i.data.title) })),
      last,
    );
  }
  return [];
}

function filter(hits: CompletionHit[], prefix: string): CompletionHit[] {
  const p = prefix.toLowerCase();
  return hits.filter((h) => h.value.toLowerCase().startsWith(p)).slice(0, 50);
}

export function completionScript(shell: "zsh" | "bash" | "fish"): string {
  if (shell === "zsh") {
    return `#compdef pb pilotbook
_pb() {
  local -a out
  local line
  while IFS=$'\\t' read -r val desc; do
    [[ -n $val ]] && out+=("\${val}:\${desc}")
  done < <(pb _complete -- "\${words[@]:1}" 2>/dev/null)
  _describe 'pilotbook' out
}
compdef _pb pb pilotbook
`;
  }
  if (shell === "bash") {
    return `_pb() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local words=("\${COMP_WORDS[@]:1}")
  COMPREPLY=($(compgen -W "$(pb _complete -- "\${words[@]}" 2>/dev/null | cut -f1)" -- "$cur"))
}
complete -F _pb pb pilotbook
`;
  }
  return `complete --command pb --arguments '(pb _complete -- (commandline -opc)[2..] | cut -f1)'
complete --command pilotbook --arguments '(pb _complete -- (commandline -opc)[2..] | cut -f1)'
`;
}

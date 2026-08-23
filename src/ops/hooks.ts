import { hostJoin } from "../core/config.ts";
import type { FileSystem } from "../core/fs.ts";
import type { OpContext } from "./context.ts";
import { briefOf, lint, nextReady, primeTarget } from "./query.ts";

export interface HookInstallResult {
  wrote: string[];
  skipped: string[];
}

const CLAUDE_HOOKS = {
  SessionStart: [
    {
      matcher: "",
      hooks: [{ type: "command", command: "pb hook session-start", timeout: 10 }],
    },
  ],
  Stop: [
    {
      matcher: "",
      hooks: [{ type: "command", command: "pb hook stop", timeout: 10 }],
    },
  ],
};

export function installHooks(ctx: OpContext): HookInstallResult {
  const wrote: string[] = [];
  const skipped: string[] = [];
  const root = ctx.project.projectRoot;
  const fs = ctx.fs;

  const claudeSettings = hostJoin(root, ".claude/settings.json");
  mergeJson(fs, claudeSettings, (cur) => {
    const hooks = (cur.hooks as Record<string, unknown>) ?? {};
    return { ...cur, hooks: { ...hooks, ...CLAUDE_HOOKS } };
  });
  wrote.push(".claude/settings.json");

  const cursorHooks = hostJoin(root, ".cursor/hooks.json");
  const cursorPayload = {
    version: 1,
    hooks: {
      sessionStart: [
        {
          command: "pb hook session-start",
        },
      ],
      stop: [
        {
          command: "pb hook stop",
        },
      ],
    },
  };
  if (fs.exists(cursorHooks)) {
    try {
      const cur = JSON.parse(fs.readFile(cursorHooks)) as Record<string, unknown>;
      const hooks = { ...((cur.hooks as Record<string, unknown>) ?? {}), ...cursorPayload.hooks };
      fs.writeFile(cursorHooks, `${JSON.stringify({ ...cur, version: 1, hooks }, null, 2)}\n`);
      wrote.push(".cursor/hooks.json");
    } catch {
      skipped.push(".cursor/hooks.json");
    }
  } else {
    fs.mkdirp(hostJoin(root, ".cursor"));
    fs.writeFile(cursorHooks, `${JSON.stringify(cursorPayload, null, 2)}\n`);
    wrote.push(".cursor/hooks.json");
  }

  return { wrote, skipped };
}

function mergeJson(
  fs: FileSystem,
  abs: string,
  merge: (cur: Record<string, unknown>) => Record<string, unknown>,
): void {
  let cur: Record<string, unknown> = {};
  if (fs.exists(abs)) {
    try {
      cur = JSON.parse(fs.readFile(abs)) as Record<string, unknown>;
    } catch {
      return;
    }
  } else {
    fs.mkdirp(hostJoin(abs, ".."));
  }
  fs.writeFile(abs, `${JSON.stringify(merge(cur), null, 2)}\n`);
}

/**
 * Primes the session with the in-progress brief under `hooks.prime_budget`. BR-003 forbids a repo
 * tour here, so nothing is emitted but the lint counts and the brief itself.
 */
export function sessionStart(ctx: OpContext): string {
  const lintRes = lint(ctx);
  const lines = [
    "# Pilotbook session",
    "",
    `Items: ${ctx.project.index.items.length}. Lint: ${lintRes.errors.length} error(s), ${lintRes.warnings.length} warning(s).`,
    "",
  ];

  const prime = primeTarget(ctx);
  if (prime) {
    const inProgress = ctx.project.index.items.filter((i) => i.data.status === "in-progress");
    if (inProgress.length > 1) {
      const others = inProgress.filter((i) => i.data.id !== prime.data.id).map((i) => i.data.id);
      lines.push(`Also in progress, not primed: ${others.join(", ")}.`, "");
    }
    const { text } = briefOf(ctx, prime.data.id, {
      budget: ctx.project.config.hooks.primeBudget,
    });
    lines.push(text.trimEnd());
    return `${lines.join("\n")}\n`;
  }

  const ready = nextReady(ctx);
  lines.push(
    "## Next ready",
    ready.length
      ? ready
          .slice(0, 8)
          .map((i) => `- ${i.id} ${i.title} (${i.priority})`)
          .join("\n")
      : "_None._",
    "",
    "Run `pb brief <ID>` before implementing.",
  );
  return `${lines.join("\n")}\n`;
}

export function hookStop(ctx: OpContext): { ok: boolean; message: string } {
  if (!ctx.project.config.hooks.blockOnUnverified) {
    return { ok: true, message: "hooks.block_on_unverified is off" };
  }
  const inProgress = ctx.project.index.items.filter((i) => i.data.status === "in-progress");
  const unverified = inProgress.filter((i) => {
    const v = i.data.verified;
    return !v || typeof v !== "object";
  });
  if (!unverified.length) return { ok: true, message: "in-progress work is verified" };
  return {
    ok: false,
    message: `Unverified in-progress: ${unverified.map((i) => i.data.id).join(", ")}. Run pb verify or set hooks.block_on_unverified: false.`,
  };
}

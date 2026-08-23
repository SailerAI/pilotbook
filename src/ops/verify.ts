import { spawnSync } from "node:child_process";
import { serializeItem, today } from "../core/frontmatter.ts";
import { contentHash } from "../core/hash.ts";
import type { ItemData } from "../core/types.ts";
import { type OpContext, PilotbookError, reload } from "./context.ts";
import { writeBoard } from "./items.ts";

function parseArgv(command: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i]!;
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur) out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

export interface VerifyResult {
  id: string;
  ok: boolean;
  hash: string;
  checks: Array<{ command: string; exit: number; ms: number }>;
  bypassed: boolean;
}

export function verifyItem(
  ctx: OpContext,
  id: string,
  opts: { force?: boolean } = {},
): VerifyResult {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  const cfg = ctx.project.config.types[item.type];
  if (!cfg) throw new PilotbookError(`unknown type ${item.type}`);
  const commands = ctx.project.config.checks.commands;
  const results: VerifyResult["checks"] = [];
  let ok = true;

  for (const command of commands) {
    const argv = parseArgv(command);
    const bin = argv[0];
    if (!bin) continue;
    const start = Date.now();
    const spawned = spawnSync(bin, argv.slice(1), {
      cwd: ctx.project.projectRoot,
      encoding: "utf8",
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const exit = spawned.status ?? 1;
    results.push({ command, exit, ms: Date.now() - start });
    if (exit !== 0) ok = false;
  }

  const bypassed = Boolean(opts.force) && !ok;
  if (!ok && !opts.force) {
    throw new PilotbookError(
      `verify failed for ${id}: ${results
        .filter((r) => r.exit !== 0)
        .map((r) => r.command)
        .join(", ")}`,
      "verify-failed",
    );
  }

  const hash = contentHash(item.data, item.body, cfg.required);
  const next: ItemData = {
    ...item.data,
    updated: today(),
    verified: {
      at: today(),
      checks: commands,
      hash,
      ...(bypassed ? { bypassed: true } : {}),
    },
  };
  ctx.fs.writeFile(item.abs, serializeItem(next, item.body, cfg.required, cfg.objects));
  reload(ctx);
  writeBoard(ctx);
  return { id, ok: ok || bypassed, hash, checks: results, bypassed };
}

import fs from "node:fs";
import path from "node:path";
import type { PilotbookConfig } from "../core/types.ts";

export interface ProjectWatch {
  close: () => void;
}

function ignored(rel: string): boolean {
  const n = rel.replaceAll("\\", "/");
  if (n === ".git" || n.startsWith(".git/") || n.includes("/.git/")) return true;
  if (n.includes("node_modules")) return true;
  if (n === ".pb" || n.startsWith(".pb/") || n.includes("/.pb/")) return true;
  return false;
}

/**
 * Notify when markdown or config under the project changes.
 * Ignores `.pb/` so graph-cache writes do not loop.
 */
export function watchProject(
  projectRoot: string,
  config: PilotbookConfig,
  configPath: string | null,
  onChange: () => void,
  opts: { debounceMs?: number } = {},
): ProjectWatch {
  const debounceMs = opts.debounceMs ?? 150;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  const watchers: fs.FSWatcher[] = [];

  const kick = (filename?: string | null): void => {
    if (closed) return;
    if (filename && ignored(filename)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!closed) onChange();
    }, debounceMs);
  };

  const watchPath = (target: string, recursive: boolean): void => {
    if (!fs.existsSync(target)) return;
    // Windows CI runners often expose TEMP through an 8.3 short path (e.g. `RUNNER~1`), while
    // libuv's recursive watcher reports change events using the long form. fs.watch stores
    // whatever path we hand it and asserts new events share its prefix — a short/long mismatch
    // trips that assertion natively and crashes the process, not just this watcher. Resolve to
    // the canonical form first so both sides agree.
    let resolved = target;
    try {
      resolved = fs.realpathSync.native(target);
    } catch {
      // Fall back to the given path if realpath fails for any reason.
    }
    try {
      watchers.push(fs.watch(resolved, { recursive }, (_event, filename) => kick(filename)));
    } catch {
      // Watching is best-effort (some hosts reject recursive watches).
    }
  };

  watchPath(path.join(projectRoot, config.root), true);
  if (configPath) watchPath(configPath, false);

  return {
    close() {
      closed = true;
      if (timer) clearTimeout(timer);
      for (const w of watchers) {
        try {
          w.close();
        } catch {
          /* already closed */
        }
      }
      watchers.length = 0;
    },
  };
}

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
    try {
      watchers.push(fs.watch(target, { recursive }, (_event, filename) => kick(filename)));
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

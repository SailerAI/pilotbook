import { hostJoin, toPosix } from "./config.ts";
import { parseFrontmatter } from "./frontmatter.ts";
import type { FileSystem } from "./fs.ts";
import type { Diagnostic, GraphIndex, ParsedItem, PilotbookConfig } from "./types.ts";

const SKIP_NAMES = new Set(["README.md", "BOARD.md"]);

interface CacheFile {
  mtimeMs: number;
  type: string;
  rel: string;
  data: ParsedItem["data"];
  body: string;
  positions: ParsedItem["positions"];
}

interface CacheShape {
  version: 1;
  files: Record<string, CacheFile>;
}

function cachePath(projectRoot: string, config: PilotbookConfig): string {
  return hostJoin(projectRoot, `${config.cacheDir}/index.json`);
}

function listMarkdown(fs: FileSystem, absDir: string, relDir: string): string[] {
  if (!fs.exists(absDir)) return [];
  const names = fs.readdir(absDir);
  const out: string[] = [];
  for (const name of names.sort()) {
    if (!name.endsWith(".md") || SKIP_NAMES.has(name)) continue;
    const abs = hostJoin(absDir, name);
    const st = fs.stat(abs);
    if (!st?.isFile) continue;
    out.push(toPosix(`${relDir}/${name}`));
  }
  return out;
}

function diagParse(file: string, message: string): Diagnostic {
  return {
    code: "parse-error",
    severity: "error",
    message,
    file,
    line: 1,
    column: 1,
  };
}

function loadCache(fs: FileSystem, abs: string): CacheShape {
  if (!fs.exists(abs)) return { version: 1, files: {} };
  try {
    const raw = JSON.parse(fs.readFile(abs)) as CacheShape;
    if (raw.version !== 1 || !raw.files) return { version: 1, files: {} };
    return raw;
  } catch {
    return { version: 1, files: {} };
  }
}

export function loadGraph(
  projectRoot: string,
  config: PilotbookConfig,
  fs: FileSystem,
): GraphIndex {
  const cacheAbs = cachePath(projectRoot, config);
  const cache = loadCache(fs, cacheAbs);
  const items: ParsedItem[] = [];
  const errors: Diagnostic[] = [];
  const nextFiles: Record<string, CacheFile> = {};
  let dirty = false;

  for (const [type, cfg] of Object.entries(config.types)) {
    const relDir = toPosix(`${config.root}/${cfg.dir}`);
    const absDir = hostJoin(projectRoot, relDir);
    for (const rel of listMarkdown(fs, absDir, relDir)) {
      const abs = hostJoin(projectRoot, rel);
      const st = fs.stat(abs);
      if (!st) continue;
      const cached = cache.files[rel];
      if (cached && cached.mtimeMs === st.mtimeMs && cached.type === type) {
        items.push({
          type,
          rel,
          abs,
          data: cached.data,
          body: cached.body,
          positions: cached.positions,
          mtimeMs: cached.mtimeMs,
        });
        nextFiles[rel] = cached;
        continue;
      }
      dirty = true;
      try {
        const text = fs.readFile(abs);
        const parsed = parseFrontmatter(text, rel);
        const item: ParsedItem = {
          type,
          rel,
          abs,
          data: parsed.data,
          body: parsed.body,
          positions: parsed.positions,
          mtimeMs: st.mtimeMs,
        };
        items.push(item);
        nextFiles[rel] = {
          mtimeMs: st.mtimeMs,
          type,
          rel,
          data: parsed.data,
          body: parsed.body,
          positions: parsed.positions,
        };
      } catch (err) {
        errors.push(diagParse(rel, err instanceof Error ? err.message : String(err)));
      }
    }
  }

  if (dirty || Object.keys(cache.files).length !== Object.keys(nextFiles).length) {
    try {
      fs.mkdirp(hostJoin(projectRoot, config.cacheDir));
      fs.writeFile(cacheAbs, `${JSON.stringify({ version: 1, files: nextFiles }, null, 2)}\n`);
    } catch {
      // cache is optional
    }
  }

  const byId = new Map<string, ParsedItem>();
  for (const item of items) {
    const id = item.data.id;
    if (typeof id === "string" && id && !byId.has(id)) byId.set(id, item);
  }

  items.sort((a, b) => a.data.id.localeCompare(b.data.id));
  return { items, byId, errors };
}

export function toPublic(item: ParsedItem): {
  id: string;
  type: string;
  rel: string;
  data: ParsedItem["data"];
  body: string;
} {
  return { id: item.data.id, type: item.type, rel: item.rel, data: item.data, body: item.body };
}

export function groupBy<T>(items: T[], keyFn: (i: T) => string | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}

export function refsOf(item: ParsedItem, edges: PilotbookConfig["edges"]): string[] {
  const out: string[] = [];
  for (const [field, kind] of Object.entries(edges)) {
    const value = item.data[field];
    if (kind.scalar) {
      if (typeof value === "string" && value) out.push(value);
    } else if (Array.isArray(value)) {
      for (const v of value) if (typeof v === "string" && v) out.push(v);
    }
  }
  return out;
}

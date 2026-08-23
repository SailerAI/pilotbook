import path from "node:path";
import type { FileStat, FileSystem } from "./fs.ts";

interface Entry {
  content: string;
  mtimeMs: number;
}

function norm(p: string): string {
  return p.replaceAll("\\", "/").replace(/\/+$/, "") || "/";
}

/** In-memory filesystem for tests. Paths are POSIX-style. */
export class MemoryFileSystem implements FileSystem {
  #cwd: string;
  #files = new Map<string, Entry>();
  #clock = 1;

  constructor(cwd = "/project") {
    this.#cwd = norm(cwd);
  }

  cwd(): string {
    return this.#cwd;
  }

  chdir(dir: string): void {
    this.#cwd = norm(dir);
  }

  seed(files: Record<string, string>): void {
    for (const [rel, content] of Object.entries(files)) {
      const abs = rel.startsWith("/") ? norm(rel) : norm(`${this.#cwd}/${rel}`);
      this.writeFile(abs, content);
    }
  }

  readFile(absPath: string): string {
    const key = norm(absPath);
    const entry = this.#files.get(key);
    if (!entry) throw new Error(`ENOENT: ${key}`);
    return entry.content;
  }

  writeFile(absPath: string, content: string): void {
    const key = norm(absPath);
    this.#files.set(key, { content, mtimeMs: this.#clock++ });
  }

  exists(absPath: string): boolean {
    const key = norm(absPath);
    if (this.#files.has(key)) return true;
    const prefix = `${key}/`;
    for (const p of this.#files.keys()) {
      if (p.startsWith(prefix)) return true;
    }
    return false;
  }

  mkdirp(_absPath: string): void {
    // directories are implicit
  }

  readdir(absPath: string): string[] {
    const key = norm(absPath);
    const prefix = `${key}/`;
    const names = new Set<string>();
    for (const p of this.#files.keys()) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      const name = rest.split("/")[0];
      if (name) names.add(name);
    }
    return [...names].sort();
  }

  stat(absPath: string): FileStat | null {
    const key = norm(absPath);
    const file = this.#files.get(key);
    if (file) return { mtimeMs: file.mtimeMs, isDirectory: false, isFile: true };
    if (this.exists(key) && !file) {
      return { mtimeMs: 0, isDirectory: true, isFile: false };
    }
    return null;
  }

  unlink(absPath: string): void {
    this.#files.delete(norm(absPath));
  }

  join(...parts: string[]): string {
    return path.posix.join(...parts.map(norm));
  }
}

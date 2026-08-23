import fs from "node:fs";
import path from "node:path";
import type { FileStat, FileSystem } from "./fs.ts";

export class NodeFileSystem implements FileSystem {
  #cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.#cwd = path.resolve(cwd);
  }

  cwd(): string {
    return this.#cwd;
  }

  readFile(absPath: string): string {
    return fs.readFileSync(absPath, "utf8");
  }

  writeFile(absPath: string, content: string): void {
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content);
  }

  exists(absPath: string): boolean {
    return fs.existsSync(absPath);
  }

  mkdirp(absPath: string): void {
    fs.mkdirSync(absPath, { recursive: true });
  }

  readdir(absPath: string): string[] {
    if (!fs.existsSync(absPath)) return [];
    return fs.readdirSync(absPath);
  }

  stat(absPath: string): FileStat | null {
    try {
      const s = fs.statSync(absPath);
      return { mtimeMs: s.mtimeMs, isDirectory: s.isDirectory(), isFile: s.isFile() };
    } catch {
      return null;
    }
  }

  unlink(absPath: string): void {
    fs.unlinkSync(absPath);
  }
}

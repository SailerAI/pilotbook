export interface FileStat {
  mtimeMs: number;
  isDirectory: boolean;
  isFile: boolean;
}

/** Injected filesystem. Paths use the host separator; core stores repo-relative paths with `/`. */
export interface FileSystem {
  cwd(): string;
  readFile(absPath: string): string;
  writeFile(absPath: string, content: string): void;
  exists(absPath: string): boolean;
  mkdirp(absPath: string): void;
  readdir(absPath: string): string[];
  stat(absPath: string): FileStat | null;
  unlink(absPath: string): void;
}

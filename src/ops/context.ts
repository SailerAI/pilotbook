import path from "node:path";
import { findProjectRoot, hostJoin, loadConfig, toPosix } from "../core/config.ts";
import type { FileSystem } from "../core/fs.ts";
import { loadGraph } from "../core/graph.ts";
import { NodeFileSystem } from "../core/node-fs.ts";
import type { LoadedProject, PeerItem, PilotbookConfig } from "../core/types.ts";

export class PilotbookError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(message: string, code = "error", status = 400) {
    super(message);
    this.name = "PilotbookError";
    this.code = code;
    this.status = status;
  }
}

export interface OpContext {
  fs: FileSystem;
  cwd: string;
  project: LoadedProject;
}

export function loadPeerManifests(
  projectRoot: string,
  config: PilotbookConfig,
  fs: FileSystem,
): Map<string, PeerItem[]> {
  const map = new Map<string, PeerItem[]>();
  for (const peer of config.peers) {
    const abs = hostJoin(projectRoot, peer.manifest);
    if (!fs.exists(abs)) continue;
    try {
      const raw = JSON.parse(fs.readFile(abs)) as {
        name?: string;
        items?: Array<{ id: string; type: string; title: string; status?: string }>;
      };
      const items: PeerItem[] = (raw.items ?? []).map((i) => ({
        id: i.id,
        type: i.type,
        title: i.title,
        status: i.status,
        repo: peer.name,
      }));
      map.set(peer.name, items);
    } catch {
      // ignore unreadable manifests; lint will not resolve those refs
    }
  }
  return map;
}

export function openProject(cwd?: string, fs?: FileSystem): LoadedProject {
  const io = fs ?? new NodeFileSystem(cwd);
  const start = cwd ? path.resolve(cwd) : io.cwd();
  const { root, configPath } = findProjectRoot(start, io);
  const config = loadConfig(root, io, configPath);
  const index = loadGraph(root, config, io);
  const peers = loadPeerManifests(root, config, io);
  return { projectRoot: root, configPath, config, index, peers };
}

export function withProject(cwd?: string, fs?: FileSystem): OpContext {
  const io = fs ?? new NodeFileSystem(cwd);
  return { fs: io, cwd: cwd ?? io.cwd(), project: openProject(cwd, io) };
}

export function reload(ctx: OpContext): LoadedProject {
  ctx.project = openProject(ctx.cwd, ctx.fs);
  return ctx.project;
}

export function relToAbs(project: LoadedProject, rel: string): string {
  return hostJoin(project.projectRoot, rel);
}

export { toPosix };

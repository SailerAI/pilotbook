import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { builtinEdges, builtinTypes, defaultConfig } from "./defaults.ts";
import type { FileSystem } from "./fs.ts";
import type { EdgeKind, PilotbookConfig, TypeConfig } from "./types.ts";

const typeOverlaySchema = z
  .object({
    dir: z.string().optional(),
    prefix: z.string().optional(),
    pad: z.number().int().positive().optional(),
    group: z.string().optional(),
    parent: z.string().optional(),
    template: z.string().optional(),
    required: z.array(z.string()).optional(),
    enums: z.record(z.array(z.string())).optional(),
    arrays: z.array(z.string()).optional(),
    numbers: z.array(z.string()).optional(),
    dates: z.array(z.string()).optional(),
    objects: z.array(z.string()).optional(),
    optional: z.array(z.string()).optional(),
  })
  .strict();

const edgeSchema = z
  .object({
    to: z.array(z.string()),
    blocking: z.boolean().optional(),
    acyclic: z.boolean().optional(),
    scalar: z.boolean().optional(),
  })
  .strict();

const fileSchema = z
  .object({
    name: z.string().optional(),
    root: z.string().optional(),
    board: z.string().optional(),
    cacheDir: z.string().optional(),
    types: z.record(typeOverlaySchema).optional(),
    edges: z.record(edgeSchema).optional(),
    code_map: z.record(z.array(z.string())).optional(),
    codeMap: z.record(z.array(z.string())).optional(),
    checks: z
      .object({
        commands: z.array(z.string()).optional(),
        report: z.string().optional(),
      })
      .optional(),
    hooks: z
      .object({
        block_on_unverified: z.boolean().optional(),
        blockOnUnverified: z.boolean().optional(),
        prime_budget: z.number().int().positive().optional(),
        primeBudget: z.number().int().positive().optional(),
      })
      .optional(),
    peers: z
      .array(
        z.object({
          name: z.string(),
          manifest: z.string(),
        }),
      )
      .optional(),
  })
  .strict();

export const CONFIG_FILENAMES: readonly string[] = [
  "pilotbook.config.yml",
  "pilotbook.config.yaml",
];

export function joinPosix(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join("/")
    .replaceAll("\\", "/")
    .replace(/\/{2,}/g, "/");
}

export function toPosix(p: string): string {
  return p.replaceAll("\\", "/");
}

export function hostJoin(root: string, rel: string): string {
  const parts = toPosix(rel).split("/").filter(Boolean);
  // Keep POSIX-absolute roots POSIX (in-memory FS and tests). path.join on
  // Windows would turn "/project" into "\\project".
  if (root.startsWith("/") && !/^[A-Za-z]:/.test(root)) {
    return path.posix.join(toPosix(root), ...parts);
  }
  return path.join(root, ...parts);
}

function walkUp(
  start: string,
  _fs: FileSystem,
  predicate: (dir: string) => boolean,
): string | null {
  let dir = start;
  while (true) {
    if (predicate(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function findProjectRoot(
  cwd: string,
  fs: FileSystem,
): { root: string; configPath: string | null } {
  const withConfig = walkUp(cwd, fs, (dir) =>
    CONFIG_FILENAMES.some((name) => fs.exists(hostJoin(dir, name))),
  );
  if (withConfig) {
    const name =
      CONFIG_FILENAMES.find((n) => fs.exists(hostJoin(withConfig, n))) ?? CONFIG_FILENAMES[0]!;
    return { root: withConfig, configPath: hostJoin(withConfig, name) };
  }
  const git = walkUp(cwd, fs, (dir) => fs.exists(hostJoin(dir, ".git")));
  if (git) return { root: git, configPath: null };
  return { root: cwd, configPath: null };
}

function overlayType(
  base: TypeConfig | undefined,
  name: string,
  raw: z.infer<typeof typeOverlaySchema>,
): TypeConfig {
  const prefix = raw.prefix ?? base?.prefix ?? `${name.toUpperCase()}-`;
  const pad = raw.pad ?? base?.pad ?? 3;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return {
    dir: raw.dir ?? base?.dir ?? name,
    prefix,
    pad,
    group: raw.group ?? base?.group ?? "backlog",
    required: raw.required ??
      base?.required ?? ["id", "title", "type", "status", "created", "updated"],
    enums: raw.enums ?? base?.enums ?? { type: [name] },
    arrays: raw.arrays ?? base?.arrays ?? ["tags"],
    numbers: raw.numbers ?? base?.numbers ?? [],
    dates: raw.dates ?? base?.dates ?? ["created", "updated"],
    objects: raw.objects ?? base?.objects ?? [],
    optional: raw.optional ?? base?.optional ?? [],
    parent: raw.parent ?? base?.parent,
    template: raw.template ?? base?.template ?? `${name}.md`,
    idPattern: new RegExp(`^${escaped}\\d{${pad}}$`),
  };
}

export function parseConfigFile(text: string): PilotbookConfig {
  const rawUnknown: unknown = text.trim() ? parseYaml(text) : {};
  const parsed = fileSchema.parse(rawUnknown ?? {});
  const base = defaultConfig();
  const types: Record<string, TypeConfig> = { ...builtinTypes() };
  if (parsed.types) {
    for (const [name, overlay] of Object.entries(parsed.types)) {
      types[name] = overlayType(types[name], name, overlay);
    }
  }
  const edges: Record<string, EdgeKind> = { ...builtinEdges() };
  if (parsed.edges) {
    for (const [name, edge] of Object.entries(parsed.edges)) {
      edges[name] = {
        to: edge.to,
        blocking: edge.blocking ?? false,
        acyclic: edge.acyclic ?? false,
        scalar: edge.scalar,
      };
    }
  }
  return {
    name: parsed.name ?? base.name,
    root: parsed.root ?? base.root,
    board: parsed.board ?? base.board,
    cacheDir: parsed.cacheDir ?? base.cacheDir,
    types,
    edges,
    codeMap: parsed.codeMap ?? parsed.code_map ?? base.codeMap,
    checks: {
      commands: parsed.checks?.commands ?? base.checks.commands,
      report: parsed.checks?.report ?? base.checks.report,
    },
    hooks: {
      blockOnUnverified:
        parsed.hooks?.blockOnUnverified ?? parsed.hooks?.block_on_unverified ?? false,
      primeBudget:
        parsed.hooks?.primeBudget ?? parsed.hooks?.prime_budget ?? base.hooks.primeBudget,
    },
    peers: parsed.peers ?? [],
  };
}

export function loadConfig(
  projectRoot: string,
  fs: FileSystem,
  configPath: string | null,
): PilotbookConfig {
  if (!configPath || !fs.exists(configPath)) return defaultConfig();
  try {
    return parseConfigFile(fs.readFile(configPath));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`${toPosix(path.relative(projectRoot, configPath) || configPath)}: ${msg}`);
  }
}

export function dumpDefaultConfig(): string {
  return `# pilotbook.config.yml
root: docs
types:
  epic:  { dir: backlog/epics,   prefix: EPIC-, pad: 3 }
  story: { dir: backlog/stories, prefix: US-,   pad: 3, parent: epic }
  task:  { dir: backlog/tasks,   prefix: TASK-, pad: 3, parent: story }
  adr:   { dir: adr,             prefix: ADR-,  pad: 4 }
  business-rule: { dir: business-rules, prefix: BR-, pad: 3 }
  idea:  { dir: ideas,           prefix: IDEA-, pad: 3 }
edges:
  depends_on:     { to: [epic, story, task], blocking: true, acyclic: true }
  business_rules: { to: [business-rule] }
  adrs:           { to: [adr] }
code_map: {}
checks:
  commands: []
  # report: .pb/junit.xml
hooks:
  block_on_unverified: false
  prime_budget: 6000
`;
}

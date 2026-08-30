import nodeFs from "node:fs";
import path from "node:path";
import { dumpDefaultConfig, hostJoin } from "../core/config.ts";
import { defaultConfig } from "../core/defaults.ts";
import { parseFrontmatter } from "../core/frontmatter.ts";
import type { FileSystem } from "../core/fs.ts";
import { NodeFileSystem } from "../core/node-fs.ts";
import { bundledSkills, bundledTemplates } from "./items.ts";
import { skillWriteAction } from "./skill-legacy.ts";

/** Skill files shipped in `skills/` and copied by `pb init`. */
export const SHIPPED_SKILLS = [
  "implement",
  "groom",
  "prioritize",
  "architect",
  "discover",
  "shape",
  "interop",
] as const;

/** Hosts `pb init` knows how to wire (ADR-0011: Cursor, Claude Code, any AGENTS.md-reading host). */
export type HostId = "cursor" | "claude" | "agents";
export const SUPPORTED_HOSTS: readonly HostId[] = ["cursor", "claude", "agents"];

/**
 * AGENTS.md carries no host name of its own — Codex and any other AGENTS.md-reading host share
 * the same install target, so `--host codex` (the name builders actually type) is an alias for
 * the generic `agents` host rather than a fourth thing to wire.
 */
function normalizeHost(id: string): string {
  return id === "codex" ? "agents" : id;
}

export interface HostReport {
  id: string;
  /** installed: skills, commands, and router all wired this run. router-only: the host has no
   * slash-command surface (US-073), so only the AGENTS.md router was installed — reported, not a
   * failure. skipped: not requested and not detected. unsupported: named via --host but pb init
   * does not know this host — reported, never silent. */
  status: "installed" | "router-only" | "skipped" | "unsupported";
  wrote: string[];
  /** Skill or command copies left alone this run because they were locally edited. */
  editedSkipped: string[];
}

export interface InitResult {
  root: string;
  wrote: string[];
  skipped: string[];
  hosts: HostReport[];
}

function detectAgents(
  fs: FileSystem,
  root: string,
): { cursor: boolean; claude: boolean; agentsMd: boolean } {
  return {
    cursor:
      fs.exists(hostJoin(root, ".cursor")) ||
      fs.exists(hostJoin(root, ".cursor/rules")) ||
      fs.exists(hostJoin(root, ".cursor/skills")),
    claude: fs.exists(hostJoin(root, ".claude")) || fs.exists(hostJoin(root, "CLAUDE.md")),
    agentsMd: fs.exists(hostJoin(root, "AGENTS.md")),
  };
}

function copyShippedSkills(
  fs: FileSystem,
  root: string,
  dest: (name: string) => string,
  refresh: boolean,
  wrote: string[],
  skipped: string[],
  editedSkipped: string[],
): void {
  const skillsDir = bundledSkills();
  for (const name of SHIPPED_SKILLS) {
    const src = path.join(skillsDir, `${name}.md`);
    if (!nodeFs.existsSync(src)) continue;
    const bundled = nodeFs.readFileSync(src, "utf8");
    const rel = dest(name);
    const abs = hostJoin(root, rel);
    const existing = fs.exists(abs) ? fs.readFile(abs) : null;
    const action = skillWriteAction(name, existing, bundled, refresh);
    if (action === "skip-exists") {
      skipped.push(rel);
      continue;
    }
    if (action === "skip-edited") {
      skipped.push(rel);
      editedSkipped.push(rel);
      continue;
    }
    fs.mkdirp(hostJoin(abs, ".."));
    fs.writeFile(abs, bundled);
    wrote.push(rel);
  }
}

/**
 * US-073: a host slash command generated from a shipped skill — one source (`skills/*.md`),
 * never a hand-maintained copy per host. The body is exactly what `pb skill <name>` prints, so
 * typing the command and running the CLI command never drift apart.
 */
export function renderSlashCommand(name: string): string {
  const src = path.join(bundledSkills(), `${name}.md`);
  const { data, body } = parseFrontmatter(nodeFs.readFileSync(src, "utf8"), src);
  const description = String(data.description ?? "");
  const stripped = body.replace(/^\n+/, "");
  const trimmedBody = stripped.endsWith("\n") ? stripped : `${stripped}\n`;
  return `---\ndescription: ${description}\n---\n\n${trimmedBody}`;
}

function copyGeneratedCommands(
  fs: FileSystem,
  root: string,
  dest: (name: string) => string,
  wrote: string[],
  skipped: string[],
  editedSkipped: string[],
): void {
  for (const name of SHIPPED_SKILLS) {
    const generated = renderSlashCommand(name);
    const rel = dest(name);
    const abs = hostJoin(root, rel);
    if (!fs.exists(abs)) {
      fs.mkdirp(hostJoin(abs, ".."));
      fs.writeFile(abs, generated);
      wrote.push(rel);
      continue;
    }
    if (fs.readFile(abs) === generated) {
      skipped.push(rel); // already in sync — nothing to regenerate
      continue;
    }
    skipped.push(rel);
    editedSkipped.push(rel); // hand-edited or stale; never overwritten automatically
  }
}

const CURSOR_RULE = `---
description: How to use Pilotbook for epics, stories, tasks, ADRs, and business rules
alwaysApply: true
---

# Pilotbook

Work items live as markdown with YAML frontmatter. Do not move files to change status. Never invent IDs — use \`pb new\`.

Load the explore/ship router, then one skill:

\`\`\`bash
pb instructions overview
pb skill discover
\`\`\`

Follow that router. Linked business rules and accepted ADRs are binding. \`pb lint\` must exit 0 before you finish.
`;

const AGENTS_SNIPPET = `
## Pilotbook

This repo uses [Pilotbook](https://github.com/SailerAI/pilotbook).

Load the explore/ship router, then one skill:

\`\`\`bash
pb instructions overview
pb skill discover
\`\`\`

Follow that router. Treat linked business rules and accepted ADRs as binding. Run \`pb lint\` before you finish. Never invent IDs.
`;

export function initProject(
  cwd: string,
  opts: { ai?: boolean; refreshSkills?: boolean; hosts?: string[] } = {},
  fs: FileSystem = new NodeFileSystem(cwd),
): InitResult {
  const root = cwd;
  const wrote: string[] = [];
  const skipped: string[] = [];
  const hosts: HostReport[] = [];
  const write = (rel: string, content: string): void => {
    const abs = hostJoin(root, rel);
    if (fs.exists(abs)) {
      skipped.push(rel);
      return;
    }
    fs.mkdirp(hostJoin(abs, ".."));
    fs.writeFile(abs, content);
    wrote.push(rel);
  };

  write("pilotbook.config.yml", dumpDefaultConfig());
  const cfg = defaultConfig();
  for (const t of Object.values(cfg.types)) {
    fs.mkdirp(hostJoin(root, `${cfg.root}/${t.dir}`));
  }
  fs.mkdirp(hostJoin(root, "templates"));

  const bundled = bundledTemplates();
  for (const name of ["epic.md", "story.md", "task.md", "adr.md", "business-rule.md", "idea.md"]) {
    const src = hostJoin(bundled, name);
    if (fs.exists(src)) write(`templates/${name}`, fs.readFile(src));
  }

  const gitignoreAbs = hostJoin(root, ".gitignore");
  const ignoreLine = ".pb";
  if (fs.exists(gitignoreAbs)) {
    const cur = fs.readFile(gitignoreAbs);
    if (!cur.split(/\r?\n/).includes(ignoreLine)) {
      fs.writeFile(
        gitignoreAbs,
        cur.endsWith("\n") ? `${cur}${ignoreLine}\n` : `${cur}\n${ignoreLine}\n`,
      );
      wrote.push(".gitignore");
    }
  } else {
    write(".gitignore", `${ignoreLine}\n`);
  }

  if (opts.ai !== false) {
    // --host names hosts explicitly (BR-005: an unsupported name is reported, never silently
    // dropped). With no --host, fall back to the original detect-or-force-all behavior so a
    // plain `pb init` keeps installing into whatever is already present.
    const requested = (opts.hosts ?? []).map((h) => h.trim()).filter(Boolean);
    const explicitIds = requested.length ? new Set(requested.map(normalizeHost)) : null;
    for (const raw of requested) {
      if (!SUPPORTED_HOSTS.includes(normalizeHost(raw) as HostId)) {
        hosts.push({ id: raw, status: "unsupported", wrote: [], editedSkipped: [] });
      }
    }

    const detected = detectAgents(fs, root);
    const refresh = Boolean(opts.refreshSkills);
    function wants(id: HostId): boolean {
      if (explicitIds) return explicitIds.has(id);
      if (id === "cursor") return detected.cursor || Boolean(opts.ai);
      if (id === "claude") return detected.claude || Boolean(opts.ai);
      return true; // "agents": AGENTS.md is always written/updated, as before this story.
    }

    if (wants("cursor")) {
      const hostWrote: string[] = [];
      const hostEdited: string[] = [];
      write(".cursor/rules/pilotbook.mdc", CURSOR_RULE);
      copyShippedSkills(
        fs,
        root,
        (name) => `.cursor/skills/${name}/SKILL.md`,
        refresh,
        hostWrote,
        skipped,
        hostEdited,
      );
      copyGeneratedCommands(
        fs,
        root,
        (name) => `.cursor/commands/${name}.md`,
        hostWrote,
        skipped,
        hostEdited,
      );
      wrote.push(...hostWrote);
      hosts.push({
        id: "cursor",
        status: "installed",
        wrote: hostWrote,
        editedSkipped: hostEdited,
      });
    } else {
      hosts.push({ id: "cursor", status: "skipped", wrote: [], editedSkipped: [] });
    }

    if (wants("claude")) {
      const hostWrote: string[] = [];
      const hostEdited: string[] = [];
      copyShippedSkills(
        fs,
        root,
        (name) => `.claude/skills/pilotbook-${name}.md`,
        refresh,
        hostWrote,
        skipped,
        hostEdited,
      );
      copyGeneratedCommands(
        fs,
        root,
        (name) => `.claude/commands/pilotbook-${name}.md`,
        hostWrote,
        skipped,
        hostEdited,
      );
      wrote.push(...hostWrote);
      hosts.push({
        id: "claude",
        status: "installed",
        wrote: hostWrote,
        editedSkipped: hostEdited,
      });
    } else {
      hosts.push({ id: "claude", status: "skipped", wrote: [], editedSkipped: [] });
    }

    if (wants("agents")) {
      // AGENTS.md-reading hosts (Codex included) have no known slash-command directory — only
      // the router installs, reported as router-only rather than as a failure (US-073 AC4).
      const hostWrote: string[] = [];
      if (detected.agentsMd) {
        const abs = hostJoin(root, "AGENTS.md");
        const cur = fs.readFile(abs);
        if (!cur.includes("Pilotbook")) {
          fs.writeFile(abs, `${cur.trimEnd()}\n${AGENTS_SNIPPET}`);
          hostWrote.push("AGENTS.md");
        }
      } else {
        const rel = "AGENTS.md";
        const abs = hostJoin(root, rel);
        if (!fs.exists(abs)) {
          fs.mkdirp(hostJoin(abs, ".."));
          fs.writeFile(abs, `# Agents\n${AGENTS_SNIPPET}`);
          hostWrote.push(rel);
        } else {
          skipped.push(rel);
        }
      }
      wrote.push(...hostWrote);
      hosts.push({ id: "agents", status: "router-only", wrote: hostWrote, editedSkipped: [] });
    } else {
      hosts.push({ id: "agents", status: "skipped", wrote: [], editedSkipped: [] });
    }
  }

  return { root, wrote, skipped, hosts };
}

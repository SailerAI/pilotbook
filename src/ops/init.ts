import nodeFs from "node:fs";
import path from "node:path";
import { dumpDefaultConfig, hostJoin, parseConfigFile, toPosix } from "../core/config.ts";
import { defaultConfig } from "../core/defaults.ts";
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
] as const;

export interface InitResult {
  root: string;
  wrote: string[];
  skipped: string[];
  notes: string[];
}

function ensureGitignoreLine(fs: FileSystem, root: string, line: string, wrote: string[]): boolean {
  const rel = ".gitignore";
  const abs = hostJoin(root, rel);
  if (!fs.exists(abs)) {
    fs.writeFile(abs, `${line}\n`);
    wrote.push(rel);
    return true;
  }
  const cur = fs.readFile(abs);
  if (cur.split(/\r?\n/).some((entry) => entry.trim() === line)) return false;
  fs.writeFile(abs, cur.endsWith("\n") ? `${cur}${line}\n` : `${cur}\n${line}\n`);
  if (!wrote.includes(rel)) wrote.push(rel);
  return true;
}

function configuredBoardRel(fs: FileSystem, root: string): string {
  const fallback = toPosix(`${defaultConfig().root}/${defaultConfig().board}`);
  const abs = hostJoin(root, "pilotbook.config.yml");
  if (!fs.exists(abs)) return fallback;
  try {
    const cfg = parseConfigFile(fs.readFile(abs));
    return toPosix(`${cfg.root}/${cfg.board}`);
  } catch {
    return fallback;
  }
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
    if (action === "skip-exists" || action === "skip-edited") {
      skipped.push(rel);
      continue;
    }
    fs.mkdirp(hostJoin(abs, ".."));
    fs.writeFile(abs, bundled);
    wrote.push(rel);
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
  opts: { ai?: boolean; refreshSkills?: boolean } = {},
  fs: FileSystem = new NodeFileSystem(cwd),
): InitResult {
  const root = cwd;
  const wrote: string[] = [];
  const skipped: string[] = [];
  const notes: string[] = [];
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

  ensureGitignoreLine(fs, root, ".pb", wrote);
  const boardRel = configuredBoardRel(fs, root);
  const addedBoard = ensureGitignoreLine(fs, root, boardRel, wrote);
  if (addedBoard && fs.exists(hostJoin(root, boardRel))) {
    notes.push(`${boardRel} is generated. If it is tracked, run: git rm --cached ${boardRel}`);
  }

  if (opts.ai !== false) {
    const detected = detectAgents(fs, root);
    const refresh = Boolean(opts.refreshSkills);
    if (detected.cursor || opts.ai) {
      write(".cursor/rules/pilotbook.mdc", CURSOR_RULE);
      copyShippedSkills(
        fs,
        root,
        (name) => `.cursor/skills/${name}/SKILL.md`,
        refresh,
        wrote,
        skipped,
      );
    }
    if (detected.claude || opts.ai) {
      copyShippedSkills(
        fs,
        root,
        (name) => `.claude/skills/pilotbook-${name}.md`,
        refresh,
        wrote,
        skipped,
      );
    }
    if (detected.agentsMd) {
      const abs = hostJoin(root, "AGENTS.md");
      const cur = fs.readFile(abs);
      if (!cur.includes("Pilotbook")) {
        fs.writeFile(abs, `${cur.trimEnd()}\n${AGENTS_SNIPPET}`);
        wrote.push("AGENTS.md");
      }
    } else {
      write("AGENTS.md", `# Agents\n${AGENTS_SNIPPET}`);
    }
  }

  return { root, wrote, skipped, notes };
}

import nodeFs from "node:fs";
import path from "node:path";
import { dumpDefaultConfig, hostJoin } from "../core/config.ts";
import { defaultConfig } from "../core/defaults.ts";
import type { FileSystem } from "../core/fs.ts";
import { NodeFileSystem } from "../core/node-fs.ts";
import { bundledSkills, bundledTemplates } from "./items.ts";

/** Skill files shipped in `skills/` and copied by `pb init`. */
export const SHIPPED_SKILLS = [
  "implement",
  "groom",
  "prioritize",
  "architect",
  "discover",
] as const;

export interface InitResult {
  root: string;
  wrote: string[];
  skipped: string[];
}

function detectAgents(
  fs: FileSystem,
  root: string,
): { cursor: boolean; claude: boolean; agentsMd: boolean } {
  return {
    cursor: fs.exists(hostJoin(root, ".cursor")) || fs.exists(hostJoin(root, ".cursor/rules")),
    claude: fs.exists(hostJoin(root, ".claude")) || fs.exists(hostJoin(root, "CLAUDE.md")),
    agentsMd: fs.exists(hostJoin(root, "AGENTS.md")),
  };
}

const CURSOR_RULE = `---
description: How to use Pilotbook for epics, stories, tasks, ADRs, and business rules
alwaysApply: true
---

# Pilotbook

Work items live as markdown with YAML frontmatter. Do not move files to change status.

1. \`pb next\` — pick unblocked work
2. \`pb brief <ID>\` — load governing rules, ADRs, and parent stories before editing code
3. Implement against the brief. Money, dates, and architecture constraints in linked BR-/ADR- files win over improvisation.
4. \`pb verify <ID>\` then set \`status: done\`
5. \`pb lint\` must exit 0. \`pb board\` refreshes the generated board.

Create items with \`pb new <type> --title "..."\`. Never invent IDs.
`;

const AGENTS_SNIPPET = `
## Pilotbook

This repo uses [Pilotbook](https://github.com/SailerAI/pilotbook). Before implementing a task:

\`\`\`bash
pb next
pb brief TASK-NNN
\`\`\`

Treat linked business rules and accepted ADRs as binding. Run \`pb lint\` before you finish.
`;

export function initProject(
  cwd: string,
  opts: { ai?: boolean } = {},
  fs: FileSystem = new NodeFileSystem(cwd),
): InitResult {
  const root = cwd;
  const wrote: string[] = [];
  const skipped: string[] = [];
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
    const detected = detectAgents(fs, root);
    if (detected.cursor || opts.ai) {
      write(".cursor/rules/pilotbook.mdc", CURSOR_RULE);
    }
    if (detected.claude || opts.ai) {
      const skillsDir = bundledSkills();
      for (const name of SHIPPED_SKILLS) {
        const src = path.join(skillsDir, `${name}.md`);
        if (!nodeFs.existsSync(src)) continue;
        write(`.claude/skills/pilotbook-${name}.md`, nodeFs.readFileSync(src, "utf8"));
      }
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

  return { root, wrote, skipped };
}

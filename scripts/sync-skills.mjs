#!/usr/bin/env node
/** Copy shipped skills (and generate host commands from them) into this repo's Cursor and Claude
 * trees. Force overwrite — this repo's own copies are always the canonical bundled content. */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const names = ["implement", "groom", "prioritize", "architect", "discover", "shape", "interop"];

/** Minimal frontmatter `description:` reader — handles a plain scalar or a `>-` folded block,
 * the only two forms `skills/*.md` uses. Good enough for command generation; not a YAML parser. */
function readDescription(raw) {
  const fmEnd = raw.indexOf("\n---", 4);
  const fm = raw.slice(4, fmEnd === -1 ? raw.length : fmEnd).split("\n");
  const idx = fm.findIndex((l) => /^description:/.test(l));
  if (idx === -1) return "";
  const first = fm[idx].replace(/^description:\s*/, "").trim();
  if (first === ">-" || first === ">" || first === "|-" || first === "|") {
    const lines = [];
    for (let i = idx + 1; i < fm.length && /^\s+\S/.test(fm[i]); i++) lines.push(fm[i].trim());
    return lines.join(" ");
  }
  return first;
}

function bodyOf(raw) {
  const fmEnd = raw.indexOf("\n---", 4);
  const rest = raw.slice(fmEnd + 4).replace(/^(\r?\n)+/, "");
  return rest.endsWith("\n") ? rest : `${rest}\n`;
}

function renderCommand(raw) {
  return `---\ndescription: ${readDescription(raw)}\n---\n\n${bodyOf(raw)}`;
}

for (const name of names) {
  const src = path.join(root, "skills", `${name}.md`);
  const raw = readFileSync(src, "utf8");

  const cursorSkillDir = path.join(root, ".cursor", "skills", name);
  mkdirSync(cursorSkillDir, { recursive: true });
  copyFileSync(src, path.join(cursorSkillDir, "SKILL.md"));

  const claudeSkillDir = path.join(root, ".claude", "skills");
  mkdirSync(claudeSkillDir, { recursive: true });
  copyFileSync(src, path.join(claudeSkillDir, `pilotbook-${name}.md`));

  const command = renderCommand(raw);
  const cursorCommandDir = path.join(root, ".cursor", "commands");
  mkdirSync(cursorCommandDir, { recursive: true });
  writeFileSync(path.join(cursorCommandDir, `${name}.md`), command);

  const claudeCommandDir = path.join(root, ".claude", "commands");
  mkdirSync(claudeCommandDir, { recursive: true });
  writeFileSync(path.join(claudeCommandDir, `pilotbook-${name}.md`), command);
}
console.log(
  `synced ${names.length} skills and commands to .cursor/{skills,commands} and .claude/{skills,commands}`,
);

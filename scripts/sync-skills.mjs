#!/usr/bin/env node
/** Copy shipped skills into this repo's Cursor and Claude trees. Force overwrite. */
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const names = ["implement", "groom", "prioritize", "architect", "discover", "shape"];
for (const name of names) {
  const src = path.join(root, "skills", `${name}.md`);
  const cursorDir = path.join(root, ".cursor", "skills", name);
  mkdirSync(cursorDir, { recursive: true });
  copyFileSync(src, path.join(cursorDir, "SKILL.md"));
  const claudeDir = path.join(root, ".claude", "skills");
  mkdirSync(claudeDir, { recursive: true });
  copyFileSync(src, path.join(claudeDir, `pilotbook-${name}.md`));
}
console.log(`synced ${names.length} skills to .cursor/skills and .claude/skills`);

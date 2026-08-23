#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
execSync("pnpm build", { stdio: "inherit" });
const packed = execSync("npm pack --json", { encoding: "utf8" });
const tarball = JSON.parse(packed)[0].filename;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pb-smoke-"));
execSync(`npm install --prefix "${dir}" "${path.join(root, tarball)}"`, { stdio: "inherit" });
const bin = path.join(dir, "node_modules", ".bin", process.platform === "win32" ? "pb.cmd" : "pb");
const version = execSync(`"${bin}" --version`, { encoding: "utf8" });
if (!/\d+\.\d+\.\d+/.test(version)) throw new Error(`unexpected version: ${version}`);
const fixture = path.join(root, "test/fixtures/healthy");
const brief = execSync(`"${bin}" brief TASK-001 --cwd "${fixture}"`, { encoding: "utf8" });
if (!brief.includes("Brief: TASK-001")) throw new Error("brief smoke failed");
fs.unlinkSync(path.join(root, tarball));
console.log("smoke ok", version.trim());

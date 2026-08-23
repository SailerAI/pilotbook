import { LineCounter, parseDocument } from "yaml";
import {
  DATE_RE,
  type FieldPos,
  type FrontmatterValue,
  type ItemData,
  type Position,
} from "./types.ts";

export interface ParsedFrontmatter {
  data: ItemData;
  body: string;
  positions: FieldPos;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toScalar(value: unknown): string | number | boolean {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return value;
  if (value == null) return "";
  return String(value);
}

function toValue(value: unknown): FrontmatterValue {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(toScalar);
  if (isRecord(value)) {
    const obj: Record<string, string | number | boolean | string[] | undefined> = {};
    for (const [k, v] of Object.entries(value)) {
      if (Array.isArray(v)) obj[k] = v.map(toScalar).map(String);
      else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") obj[k] = v;
      else if (v == null) obj[k] = undefined;
      else obj[k] = String(v);
    }
    return obj;
  }
  return toScalar(value);
}

export function parseFrontmatter(text: string, file: string): ParsedFrontmatter {
  const normalized = text.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---\n") && !normalized.startsWith("---\r\n")) {
    throw new Error(`${file}: missing opening frontmatter ---`);
  }
  const end = normalized.search(/\n---(?:\r?\n|$)/);
  if (end === -1) throw new Error(`${file}: missing closing frontmatter ---`);
  const yamlText = normalized.slice(normalized.indexOf("\n") + 1, end);
  const after = normalized.slice(end + 1);
  const bodyStart = after.indexOf("\n");
  const body = (bodyStart === -1 ? "" : after.slice(bodyStart + 1)).replace(/^\r?\n/, "");

  const lineCounter = new LineCounter();
  const doc = parseDocument(yamlText, { lineCounter, keepSourceTokens: true });
  if (doc.errors.length) {
    const first = doc.errors[0]!;
    throw new Error(`${file}: ${first.message}`);
  }
  const json: unknown = doc.toJSON();
  if (!isRecord(json)) throw new Error(`${file}: frontmatter must be a mapping`);

  const positions: FieldPos = {};
  const contents = doc.contents;
  if (contents && typeof contents === "object" && "items" in contents) {
    const items = (
      contents as { items: Array<{ key?: { value?: unknown; range?: [number, number] } }> }
    ).items;
    for (const pair of items) {
      const key = pair.key?.value;
      const range = pair.key?.range;
      if (typeof key === "string" && range) {
        const pos = lineCounter.linePos(range[0]);
        // YAML body starts at line 2 of the file (after opening ---)
        positions[key] = { line: pos.line + 1, column: pos.col };
      }
    }
  }

  const data: ItemData = { id: "", title: "", type: "" };
  for (const [key, value] of Object.entries(json)) {
    data[key] = toValue(value);
  }
  if (typeof data.id !== "string") data.id = String(data.id ?? "");
  if (typeof data.title !== "string") data.title = String(data.title ?? "");
  if (typeof data.type !== "string") data.type = String(data.type ?? "");
  return { data, body, positions };
}

function formatScalar(value: string | number | boolean): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const s = String(value);
  if (s === "" || /[:#[\]{}&*!|>'"%@`]|^\s|\s$/.test(s) || ["true", "false", "null"].includes(s)) {
    return JSON.stringify(s);
  }
  return s;
}

function formatValue(value: FrontmatterValue): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    return `[${value.map((v) => formatScalar(v)).join(", ")}]`;
  }
  if (typeof value === "object") {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      parts.push(
        `${k}: ${Array.isArray(v) ? `[${v.map((x) => formatScalar(x)).join(", ")}]` : formatScalar(v)}`,
      );
    }
    return `{ ${parts.join(", ")} }`;
  }
  return formatScalar(value);
}

export function serializeItem(
  data: ItemData,
  body: string,
  required: string[],
  extraKeys: string[] = [],
): string {
  const lines = ["---"];
  const seen = new Set<string>();
  for (const key of [...required, ...extraKeys]) {
    if (!(key in data) || seen.has(key)) continue;
    seen.add(key);
    const value = data[key];
    if (value === "" || value === undefined) continue;
    lines.push(`${key}: ${formatValue(value)}`);
  }
  for (const key of Object.keys(data)) {
    if (seen.has(key)) continue;
    const value = data[key];
    if (value === "" || value === undefined) continue;
    lines.push(`${key}: ${formatValue(value)}`);
  }
  lines.push("---", "");
  const trimmed = String(body ?? "")
    .replace(/^\n+/, "")
    .replace(/\s+$/, "");
  return `${lines.join("\n")}${trimmed}\n`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isDate(value: unknown): boolean {
  return typeof value === "string" && DATE_RE.test(value);
}

export function emptyPos(): Position {
  return { line: 1, column: 1 };
}

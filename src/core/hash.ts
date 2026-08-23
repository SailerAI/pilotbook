import { createHash } from "node:crypto";
import { serializeItem } from "./frontmatter.ts";
import type { ItemData } from "./types.ts";

const SKIP = new Set(["verified", "updated"]);

export function contentHash(data: ItemData, body: string, required: string[]): string {
  const copy: ItemData = { ...data };
  for (const key of SKIP) delete copy[key];
  const text = serializeItem(
    copy,
    body,
    required.filter((k) => !SKIP.has(k)),
  );
  return createHash("sha256").update(text).digest("hex").slice(0, 12);
}

import { randomBytes } from "node:crypto";
import type { ParsedItem, TypeConfig } from "./types.ts";

/** Crockford base32, uppercase, excluding I, L, O, and U. */
export const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const RANDOM_ID_LENGTH = 6;

const MAX_ID_ATTEMPTS = 8;

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Legacy padded numbers and new Crockford ids. `pad` only accepts ids already in the graph. */
export function idPatternFor(prefix: string, pad: number): RegExp {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?:\\d{${pad}}|[${CROCKFORD}]{${RANDOM_ID_LENGTH}})$`);
}

export function nextId(
  type: string,
  cfg: TypeConfig,
  items: ParsedItem[],
  random: (size: number) => Uint8Array = (size) => randomBytes(size),
): string {
  const taken = new Set<string>();
  for (const item of items) {
    if (item.type !== type) continue;
    const id = item.data.id;
    if (typeof id === "string" && id) taken.add(id);
  }
  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const body = encodeCrockford(random(RANDOM_ID_LENGTH));
    if (/^\d+$/.test(body)) continue;
    const id = `${cfg.prefix}${body}`;
    if (!taken.has(id)) return id;
  }
  throw new Error(`could not allocate an id for ${type}`);
}

function encodeCrockford(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += CROCKFORD[byte % CROCKFORD.length];
  return out;
}

export function splitRemoteId(ref: string): { repo: string | null; id: string } {
  const idx = ref.indexOf("#");
  if (idx === -1) return { repo: null, id: ref };
  return { repo: ref.slice(0, idx), id: ref.slice(idx + 1) };
}

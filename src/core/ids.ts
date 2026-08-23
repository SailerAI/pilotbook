import type { ParsedItem, TypeConfig } from "./types.ts";

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

export function nextId(type: string, cfg: TypeConfig, items: ParsedItem[]): string {
  let max = 0;
  for (const item of items) {
    if (item.type !== type) continue;
    const n = Number(String(item.data.id).slice(cfg.prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${cfg.prefix}${String(max + 1).padStart(cfg.pad, "0")}`;
}

export function splitRemoteId(ref: string): { repo: string | null; id: string } {
  const idx = ref.indexOf("#");
  if (idx === -1) return { repo: null, id: ref };
  return { repo: ref.slice(0, idx), id: ref.slice(idx + 1) };
}

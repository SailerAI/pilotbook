import type { OpContext } from "./context.ts";
import { type SimilarHit, similarItems } from "./query.ts";
import { tokenize, tokenOverlap } from "./tokens.ts";

export interface GroundArea {
  key: string;
  paths: string[];
  hits: number;
}

export interface GroundResult {
  query: string;
  areas: GroundArea[];
  items: SimilarHit[];
  unmapped: boolean;
}

/** Map a demand onto `codeMap` prefixes and live graph items. Empty `codeMap` is not an error. */
export function groundDemand(ctx: OpContext, q: string): GroundResult {
  const query = q.trim();
  const qTokens = tokenize(query);
  const areas: GroundArea[] = [];
  for (const [key, paths] of Object.entries(ctx.project.config.codeMap)) {
    const hay = tokenize([key, ...paths].join(" "));
    const hits = tokenOverlap(qTokens, hay);
    if (hits > 0) areas.push({ key, paths: [...paths], hits });
  }
  areas.sort((a, b) => b.hits - a.hits || a.key.localeCompare(b.key));
  const items = query ? similarItems(ctx, query) : [];
  return {
    query,
    areas,
    items,
    unmapped: areas.length === 0,
  };
}

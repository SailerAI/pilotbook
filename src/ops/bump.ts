import { extraKeys } from "../core/defaults.ts";
import { serializeItem, today } from "../core/frontmatter.ts";
import { bodyHash } from "../core/hash.ts";
import type { ItemData } from "../core/types.ts";
import { type OpContext, PilotbookError, reload } from "./context.ts";
import { writeBoard } from "./items.ts";

export type BumpResult =
  | {
      bumped: true;
      id: string;
      version: number;
      amended: string;
      content_hash: string;
    }
  | { bumped: false; warning: string; code: string };

export function bumpItem(ctx: OpContext, id: string): BumpResult {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  if (item.type !== "adr" && item.type !== "business-rule") {
    throw new PilotbookError(
      `${id} is not a business-rule or adr`,
      "wrong-type",
      400,
      "pb bump <BR-ID|ADR-ID>",
    );
  }
  const current = bodyHash(item.body);
  const stored = typeof item.data.content_hash === "string" ? item.data.content_hash : "";
  if (stored === current) {
    return {
      bumped: false,
      warning: `${id} body is unchanged; not bumping`,
      code: "unchanged",
    };
  }
  const cfg = ctx.project.config.types[item.type]!;
  const version = (typeof item.data.version === "number" ? item.data.version : 1) + 1;
  const amended = today();
  const next: ItemData = {
    ...item.data,
    version,
    amended,
    content_hash: current,
    updated: amended,
  };
  ctx.fs.writeFile(item.abs, serializeItem(next, item.body, cfg.required, extraKeys(cfg)));
  reload(ctx);
  writeBoard(ctx);
  return { bumped: true, id, version, amended, content_hash: current };
}

import { inboundOf } from "../core/graph.ts";
import { type OpContext, PilotbookError } from "./context.ts";

export interface ImpactEntry {
  id: string;
  type: string;
  title: string;
  status: unknown;
  done: boolean;
}

export interface ImpactReport {
  id: string;
  type: string;
  version: number;
  items: ImpactEntry[];
}

export function impactOf(ctx: OpContext, id: string): ImpactReport {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  if (item.type !== "adr" && item.type !== "business-rule") {
    throw new PilotbookError(
      `${id} is not a business-rule or adr`,
      "wrong-type",
      400,
      "pb impact <BR-ID|ADR-ID>",
    );
  }
  const inbound = inboundOf(ctx.project.index, id, ["business_rules", "adrs"]).filter(
    (other) => other.type === "story" || other.type === "task",
  );
  return {
    id,
    type: item.type,
    version: typeof item.data.version === "number" ? item.data.version : 1,
    items: inbound.map((other) => ({
      id: other.data.id,
      type: other.type,
      title: String(other.data.title ?? ""),
      status: other.data.status,
      done: other.data.status === "done",
    })),
  };
}

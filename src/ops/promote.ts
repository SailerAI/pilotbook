import { today } from "../core/frontmatter.ts";
import { extractSection, upsertSection } from "../core/markdown.ts";
import { type PublicItem, SIZE } from "../core/types.ts";
import { type OpContext, PilotbookError } from "./context.ts";
import { createItem, updateItem } from "./items.ts";

const WHY_PLACEHOLDER = "Who benefits and why this is worth capturing.";

export interface PromoteInput {
  to: "epic" | "story";
  title: string;
  epic?: string;
  dryRun?: boolean;
}

export interface PromoteResult {
  dryRun: boolean;
  type: "epic" | "story";
  title: string;
  epic?: string;
  idea?: PublicItem;
  created?: PublicItem;
}

export interface RejectResult {
  verdict: "kill";
  id: string;
  status: "rejected";
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

function isSize(value: unknown): boolean {
  return SIZE.includes(String(value) as (typeof SIZE)[number]);
}

function whyFilled(body: string): boolean {
  const why = extractSection(body, "Why");
  return Boolean(why) && why !== WHY_PLACEHOLDER;
}

export function promoteIdea(ctx: OpContext, id: string, input: PromoteInput): PromoteResult {
  const to = input.to;
  if (to !== "epic" && to !== "story") {
    throw new PilotbookError("to must be epic or story", "invalid-to");
  }
  const title = String(input.title ?? "").trim();
  if (!title) throw new PilotbookError("title is required");
  if (to === "story" && !input.epic) {
    throw new PilotbookError(
      "promoting to a story requires --epic <ID>",
      "missing-epic",
      400,
      `pb promote ${id} --to story --epic EPIC-NNN --title "..."`,
    );
  }

  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  if (item.type !== "idea") throw new PilotbookError(`${id} is not an idea`, "wrong-type");

  const status = String(item.data.status ?? "");
  if (status === "rejected") {
    throw new PilotbookError(
      `${id} is rejected and cannot be promoted`,
      "rejected",
      400,
      `pb new idea --title "..."`,
    );
  }
  if (status === "exploring") {
    // researched enough to promote
  } else if (status === "raw") {
    if (!isSize(item.data.impact) || !isSize(item.data.effort) || !whyFilled(item.body)) {
      throw new PilotbookError(
        `${id} is not ready to promote: fill Why, impact, and effort (or set status: exploring)`,
        "not-ready",
        400,
        `pb clarify ${id}`,
      );
    }
  } else {
    throw new PilotbookError(
      `${id} has status ${status} and cannot be promoted`,
      "not-ready",
      400,
      `pb clarify ${id}`,
    );
  }

  const plan: PromoteResult = {
    dryRun: Boolean(input.dryRun),
    type: to,
    title,
    ...(to === "story" ? { epic: String(input.epic) } : {}),
  };
  if (input.dryRun) return plan;

  const created = createItem(ctx, {
    type: to,
    title,
    ...(to === "story" ? { epic: String(input.epic) } : {}),
  });
  const promotedTo = [...asList(item.data.promoted_to), created.id];
  const idea = updateItem(ctx, id, { data: { promoted_to: promotedTo, status: "promoted" } });
  return { ...plan, idea, created };
}

export function rejectIdea(ctx: OpContext, id: string, input: { reason: string }): RejectResult {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
  if (item.type !== "idea") throw new PilotbookError(`${id} is not an idea`, "wrong-type");
  const reason = String(input.reason ?? "").trim();
  if (!reason) throw new PilotbookError("reason is required");
  const date = today();
  const body = upsertSection(item.body, "Verdict", `${date} — ${reason}`);
  updateItem(ctx, id, { data: { status: "rejected" }, body });
  return { verdict: "kill", id, status: "rejected" };
}

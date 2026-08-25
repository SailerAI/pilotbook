import { appendChecklistItem, isTemplateCriterion, parseChecklist } from "../core/checklist.ts";
import {
  extractSection,
  hasEvidence,
  isBlankOrPlaceholder,
  upsertSection,
} from "../core/markdown.ts";
import type { PublicItem } from "../core/types.ts";
import { type OpContext, PilotbookError } from "./context.ts";
import { createItem, getItem, updateItem } from "./items.ts";

export const WRITE_KINDS = ["criterion", "business-rule", "open-question"] as const;
export type WriteKind = (typeof WRITE_KINDS)[number];

export interface ClarifyOption {
  id: WriteKind;
  label: string;
  kind: WriteKind;
}

export interface ClarifyQuestion {
  id: string;
  prompt: string;
  options: ClarifyOption[];
}

export interface ClarifyResult {
  id: string;
  ready: boolean;
  questions: ClarifyQuestion[];
}

export interface ClarifyAnswer {
  question: string;
  option: string;
  text?: string;
}

export interface ApplyResult {
  id: string;
  ready: boolean;
  applied: Array<{ question: string; kind: WriteKind; detail: string }>;
  item: PublicItem;
}

const OPTIONS: ClarifyOption[] = [
  { id: "criterion", label: "Write an acceptance criterion", kind: "criterion" },
  { id: "business-rule", label: "Allocate a business rule", kind: "business-rule" },
  { id: "open-question", label: "Log an open question", kind: "open-question" },
];

const WHY_PLACEHOLDER = "Who benefits and why this is worth capturing.";
const SKETCH_PLACEHOLDER = "A rough shape of the solution. Not a spec.";
const OPEN_Q_PLACEHOLDER = "Question 1";
const JTBD_PLACEHOLDER = "The job the user is hiring this for.";
const PERSONAS_PLACEHOLDER = "Who this is for, in one or two named roles.";
const PRIOR_ART_PLACEHOLDER = "Product, link, what they do, what we would do differently.";
const EVIDENCE_PLACEHOLDER = "At least one URL or internal ID (ADR-, BR-, US-).";
const GOAL_PLACEHOLDER = "Describe the outcome of this epic.";
const OUTCOME_PLACEHOLDER = "What will be true when this epic is done.";

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value) return [value];
  return [];
}

function question(id: string, prompt: string): ClarifyQuestion {
  return { id, prompt, options: OPTIONS };
}

function criteriaGap(body: string): boolean {
  const section = extractSection(body, "Acceptance criteria");
  if (!section) return true;
  const items = parseChecklist(section);
  if (!items.length) return true;
  return items.length === 1 && isTemplateCriterion(items[0]!.text);
}

export function clarifyItem(ctx: OpContext, id: string): ClarifyResult {
  const item = ctx.project.index.byId.get(id);
  if (!item) throw new PilotbookError(`not found: ${id}`, "not-found", 404);

  const questions: ClarifyQuestion[] = [];
  if (item.type === "story") {
    if (criteriaGap(item.body)) {
      questions.push(
        question(
          "acceptance-criteria",
          `${id} has no useful acceptance criteria. How should we pin the outcome?`,
        ),
      );
    }
    if (!asList(item.data.business_rules).length) {
      questions.push(
        question(
          "business-rules",
          `${id} has no linked business rules. How should we capture the constraint?`,
        ),
      );
    }
  } else if (item.type === "epic") {
    const goal = String(item.data.goal ?? "");
    if (isBlankOrPlaceholder(goal, [GOAL_PLACEHOLDER])) {
      questions.push(
        question("goal", `${id} has an empty or placeholder goal. How should we pin the outcome?`),
      );
    }
    const outcome = extractSection(item.body, "Outcome");
    if (isBlankOrPlaceholder(outcome, [OUTCOME_PLACEHOLDER])) {
      questions.push(
        question(
          "outcome",
          `${id} has an empty or placeholder Outcome section. How should we pin it?`,
        ),
      );
    }
  } else if (item.type === "idea") {
    const why = extractSection(item.body, "Why");
    if (isBlankOrPlaceholder(why, [WHY_PLACEHOLDER])) {
      questions.push(
        question("why", `${id} has a placeholder Why section. How should we pin the demand?`),
      );
    }
    const sketch = extractSection(item.body, "Sketch");
    if (isBlankOrPlaceholder(sketch, [SKETCH_PLACEHOLDER])) {
      questions.push(
        question("sketch", `${id} has an empty Sketch. How should we capture a rough shape?`),
      );
    }
    const jtbd = extractSection(item.body, "Jobs to be done");
    if (isBlankOrPlaceholder(jtbd, [JTBD_PLACEHOLDER])) {
      questions.push(
        question("jtbd", `${id} has a placeholder Jobs to be done. What job is this hired for?`),
      );
    }
    const personas = extractSection(item.body, "Personas");
    if (isBlankOrPlaceholder(personas, [PERSONAS_PLACEHOLDER])) {
      questions.push(question("personas", `${id} has placeholder Personas. Who is this for?`));
    }
    const prior = extractSection(item.body, "Prior art");
    if (isBlankOrPlaceholder(prior, [PRIOR_ART_PLACEHOLDER])) {
      questions.push(
        question("prior-art", `${id} has no Prior art. Which products or links should we cite?`),
      );
    }
    const evidence = extractSection(item.body, "Evidence");
    if (isBlankOrPlaceholder(evidence, [EVIDENCE_PLACEHOLDER]) || !hasEvidence(evidence)) {
      questions.push(
        question("evidence", `${id} has no evidence URL or internal ID. What should we cite?`),
      );
    }
    const open = extractSection(item.body, "Open questions");
    if (isBlankOrPlaceholder(open, [OPEN_Q_PLACEHOLDER])) {
      questions.push(
        question(
          "open-questions",
          `${id} still has the template open question. How should we record what is unknown?`,
        ),
      );
    }
  }

  return { id, ready: questions.length === 0, questions };
}

export function normalizeAnswers(raw: unknown): ClarifyAnswer[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { answers?: unknown }).answers)
      ? (raw as { answers: unknown[] }).answers
      : null;
  if (!list) throw new PilotbookError("answers must be a JSON array");
  return list.map((entry, i) => {
    if (!entry || typeof entry !== "object") {
      throw new PilotbookError(`answers[${i}] must be an object`);
    }
    const rec = entry as Record<string, unknown>;
    const questionId = String(rec.question ?? rec.id ?? "").trim();
    const option = String(rec.option ?? rec.kind ?? "").trim();
    if (!questionId) throw new PilotbookError(`answers[${i}].question is required`);
    if (!option) throw new PilotbookError(`answers[${i}].option is required`);
    return {
      question: questionId,
      option,
      text: rec.text != null ? String(rec.text) : undefined,
    };
  });
}

function appendOpenQuestion(body: string, type: string, text: string): string {
  if (type === "idea") {
    const section = extractSection(body, "Open questions");
    const placeholder = isBlankOrPlaceholder(section, [OPEN_Q_PLACEHOLDER]);
    const next = placeholder || !section.trim() ? `- ${text}` : `${section.trim()}\n- ${text}`;
    return upsertSection(body, "Open questions", next);
  }
  const section = extractSection(body, "Clarifications");
  const next = section.trim() ? `${section.trim()}\n- ${text}` : `- ${text}`;
  return upsertSection(body, "Clarifications", next);
}

export function applyClarifications(ctx: OpContext, id: string, rawAnswers: unknown): ApplyResult {
  const detection = clarifyItem(ctx, id);
  const answers = normalizeAnswers(rawAnswers);
  const byId = new Map(detection.questions.map((q) => [q.id, q]));
  const applied: ApplyResult["applied"] = [];

  for (const answer of answers) {
    const q = byId.get(answer.question);
    if (!q) throw new PilotbookError(`unknown question: ${answer.question}`, "unknown-question");
    const opt = q.options.find((o) => o.id === answer.option || o.kind === answer.option);
    if (!opt) throw new PilotbookError(`unknown option: ${answer.option}`, "unknown-option");
    const text = String(answer.text ?? "").trim();
    if (!text) throw new PilotbookError(`text is required for ${opt.kind}`);

    const current = ctx.project.index.byId.get(id);
    if (!current) throw new PilotbookError(`not found: ${id}`, "not-found", 404);

    if (opt.kind === "criterion") {
      updateItem(ctx, id, { body: appendChecklistItem(current.body, text) });
      applied.push({ question: q.id, kind: opt.kind, detail: text });
    } else if (opt.kind === "business-rule") {
      const rule = createItem(ctx, { type: "business-rule", title: text });
      const fresh = ctx.project.index.byId.get(id);
      if (!fresh) throw new PilotbookError(`not found: ${id}`, "not-found", 404);
      const field = fresh.type === "story" ? "business_rules" : "related";
      const next = [...asList(fresh.data[field]), rule.id];
      updateItem(ctx, id, { data: { [field]: next } });
      applied.push({ question: q.id, kind: opt.kind, detail: rule.id });
    } else {
      updateItem(ctx, id, { body: appendOpenQuestion(current.body, current.type, text) });
      applied.push({ question: q.id, kind: opt.kind, detail: text });
    }
  }

  return {
    id,
    ready: clarifyItem(ctx, id).ready,
    applied,
    item: getItem(ctx, id),
  };
}

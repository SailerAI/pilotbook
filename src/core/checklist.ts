import { extractSection, isBlankOrPlaceholder, upsertSection } from "./markdown.ts";

export interface ChecklistItem {
  /** 1-based parse order of checklist items under the heading. */
  index: number;
  text: string;
  checked: boolean;
}

const ITEM_RE = /^(\s*[-*+]\s+)\[([ xX])\]\s+(.*)$/;

export const TEMPLATE_CRITERION = "Given …, when …, then …";

export function parseChecklist(section: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  for (const line of String(section ?? "").split(/\r?\n/)) {
    const match = ITEM_RE.exec(line);
    if (!match) continue;
    items.push({
      index: items.length + 1,
      text: match[3]!.trim(),
      checked: /\S/.test(match[2]!),
    });
  }
  return items;
}

export function serializeChecklist(items: ChecklistItem[]): string {
  return items.map((item) => `- [${item.checked ? "x" : " "}] ${item.text}`).join("\n");
}

export function isTemplateCriterion(text: string): boolean {
  return isBlankOrPlaceholder(text, [TEMPLATE_CRITERION, "Given ..., when ..., then ..."]);
}

/** Append a checklist item under a heading. Prose in that section is kept; the template placeholder is replaced. */
export function appendChecklistItem(
  body: string,
  text: string,
  heading = "Acceptance criteria",
): string {
  const section = extractSection(body, heading);
  const items = parseChecklist(section);
  const placeholderOnly = items.length === 1 && isTemplateCriterion(items[0]!.text);
  if (placeholderOnly) {
    return upsertSection(body, heading, serializeChecklist([{ index: 1, text, checked: false }]));
  }
  if (items.length === 0 && section.trim()) {
    return upsertSection(body, heading, `${section.trim()}\n\n- [ ] ${text}`);
  }
  const next = [...items, { index: items.length + 1, text, checked: false }];
  return upsertSection(body, heading, serializeChecklist(next));
}

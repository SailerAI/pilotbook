function headingRe(heading: string): RegExp {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^##\\s+${escaped}\\s*$`, "im");
}

/** Body slice under `## heading` until the next `##`, trimmed. Empty if missing. */
export function extractSection(body: string, heading: string): string {
  const re = headingRe(heading);
  const match = re.exec(body);
  if (!match || match.index === undefined) return "";
  const start = match.index + match[0].length;
  const rest = body.slice(start);
  const next = rest.search(/^##\s+/m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

/** Replace or append a `## heading` block. Surrounding sections are preserved. */
export function upsertSection(body: string, heading: string, content: string): string {
  const block = `## ${heading}\n\n${content.trim()}\n`;
  const re = headingRe(heading);
  const match = re.exec(body);
  if (!match || match.index === undefined) {
    const trimmed = String(body ?? "").replace(/\s+$/, "");
    return `${trimmed ? `${trimmed}\n\n` : ""}${block}`;
  }
  const rest = body.slice(match.index + match[0].length);
  const next = rest.search(/^##\s+/m);
  const after = next === -1 ? "" : rest.slice(next).replace(/^\n+/, "");
  const before = body.slice(0, match.index).replace(/\s+$/, "");
  const parts = [before, block.replace(/\n+$/, "")];
  if (after) parts.push(after.replace(/\s+$/, ""));
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}

export function normalizeProse(text: string): string {
  return text.trim().replaceAll("…", "...").replace(/\s+/g, " ").toLowerCase();
}

export function isBlankOrPlaceholder(section: string, placeholders: readonly string[]): boolean {
  const got = normalizeProse(section);
  if (!got) return true;
  return placeholders.some((p) => {
    const want = normalizeProse(p);
    return got === want || got === `- ${want}` || got === `* ${want}`;
  });
}

/** A URL or an internal Pilotbook ID counts as evidence. */
export const EVIDENCE_RE: RegExp = /https?:\/\/[^\s)]+|\b(?:ADR|BR|US|EPIC|IDEA|TASK)-\d+\b/i;

export function hasEvidence(text: string): boolean {
  return EVIDENCE_RE.test(String(text ?? ""));
}

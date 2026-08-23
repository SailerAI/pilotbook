/** One `<testcase>` from a JUnit report. `time` is seconds, 0 when the attribute is absent. */
export interface TestResult {
  name: string;
  classname: string;
  status: "pass" | "fail" | "error" | "skipped";
  time: number;
}

const TAG = "<testcase";
const CLOSE = "</testcase";
const CDATA_OPEN = "<![CDATA[";
const CDATA_CLOSE = "]]>";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function unescapeXml(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (!body.startsWith("#")) return NAMED_ENTITIES[body] ?? whole;
    const code =
      body[1] === "x" ? Number.parseInt(body.slice(2), 16) : Number.parseInt(body.slice(1), 10);
    if (!Number.isInteger(code) || code < 1 || code > 0x10ffff) return whole;
    return String.fromCodePoint(code);
  });
}

const ATTR_RE = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function parseAttrs(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of text.matchAll(ATTR_RE)) {
    out[m[1]!] = unescapeXml(m[2] ?? m[3] ?? "");
  }
  return out;
}

/** Index of the `>` closing the tag started at `from`, ignoring `>` inside attribute quotes. */
function findTagEnd(xml: string, from: number): number {
  let quote: string | null = null;
  for (let i = from; i < xml.length; i++) {
    const ch = xml[i]!;
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === ">") return i;
  }
  return -1;
}

/**
 * Markup between a `<testcase>` and its close tag, with CDATA dropped so a failure
 * message containing raw `<testcase` cannot desync the scan.
 */
function takeBody(xml: string, from: number): { markup: string; next: number } | null {
  let i = from;
  let markup = "";
  while (i < xml.length) {
    const cdata = xml.indexOf(CDATA_OPEN, i);
    const close = xml.indexOf(CLOSE, i);
    if (close < 0) return null;
    if (cdata >= 0 && cdata < close) {
      const end = xml.indexOf(CDATA_CLOSE, cdata);
      if (end < 0) return null;
      markup += xml.slice(i, cdata);
      i = end + CDATA_CLOSE.length;
      continue;
    }
    markup += xml.slice(i, close);
    const tagEnd = xml.indexOf(">", close);
    return { markup, next: tagEnd < 0 ? xml.length : tagEnd + 1 };
  }
  return null;
}

function deriveStatus(markup: string): TestResult["status"] {
  if (/<failure[\s/>]/.test(markup)) return "fail";
  if (/<error[\s/>]/.test(markup)) return "error";
  if (/<skipped[\s/>]/.test(markup)) return "skipped";
  return "pass";
}

function toSeconds(raw: string | undefined): number {
  const n = Number.parseFloat(raw ?? "");
  return Number.isFinite(n) ? n : 0;
}

/**
 * Scan a JUnit XML report into per-test results. Malformed input yields `[]` rather
 * than throwing: a corrupt report is no more an error than a missing one.
 */
export function parseJUnit(xml: string): TestResult[] {
  const out: TestResult[] = [];
  let i = 0;
  while (i < xml.length) {
    const cdata = xml.indexOf(CDATA_OPEN, i);
    const open = xml.indexOf(TAG, i);
    if (open < 0) break;
    if (cdata >= 0 && cdata < open) {
      const end = xml.indexOf(CDATA_CLOSE, cdata);
      if (end < 0) return [];
      i = end + CDATA_CLOSE.length;
      continue;
    }
    const nameEnd = open + TAG.length;
    // Guard against sibling elements that merely start with the same characters.
    if (!/^[\s/>]/.test(xml.slice(nameEnd, nameEnd + 1))) {
      i = nameEnd;
      continue;
    }
    const tagEnd = findTagEnd(xml, nameEnd);
    if (tagEnd < 0) return [];
    const selfClosing = xml[tagEnd - 1] === "/";
    const attrs = parseAttrs(xml.slice(nameEnd, selfClosing ? tagEnd - 1 : tagEnd));
    let status: TestResult["status"] = "pass";
    let next = tagEnd + 1;
    if (!selfClosing) {
      const body = takeBody(xml, next);
      if (!body) return [];
      status = deriveStatus(body.markup);
      next = body.next;
    }
    out.push({
      name: attrs.name ?? "",
      classname: attrs.classname ?? "",
      status,
      time: toSeconds(attrs.time),
    });
    i = next;
  }
  return out;
}

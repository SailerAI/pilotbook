/** Token overlap for `pb similar` / `pb ground`. No embeddings. */

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "for",
  "on",
  "is",
  "it",
  "this",
  "that",
  "with",
  "from",
  "by",
  "as",
  "at",
  "be",
  "are",
  "was",
  "were",
  "not",
  "but",
  "if",
  "we",
  "you",
  "i",
]);

/** Split on non-alphanumerics, drop length ≤ 2 and a small stopword list. */
export function tokenize(text: string): string[] {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export function tokenOverlap(query: string[], haystack: string[]): number {
  if (!query.length || !haystack.length) return 0;
  const set = new Set(haystack);
  let n = 0;
  for (const t of query) if (set.has(t)) n += 1;
  return n;
}

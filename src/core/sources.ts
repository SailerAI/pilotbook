/**
 * BR-006: "Stored sources MUST be sanitized: strip userinfo (`user:password@`) and credential or
 * signature query parameters before writing a URL into an item." A pure function so skills and
 * ops share one implementation rather than each re-deriving the credential-param list.
 */

const CREDENTIAL_PARAM = new RegExp(
  [
    "^token$",
    "^access[_-]?token$",
    "^refresh[_-]?token$",
    "^api[_-]?key$",
    "^apikey$",
    "^key$",
    "^secret$",
    "^signature$",
    "^sig$",
    "^password$",
    "^auth$",
    "^x-amz-signature$",
    "^x-amz-credential$",
    "^x-amz-security-token$",
  ].join("|"),
  "i",
);

export interface SanitizedSource {
  /** false when `raw` does not parse as a URL at all — BR-006: "a benchmark whose source cannot
   * be sanitized... MUST NOT be stored with its URL; record the host and the retrieval date
   * instead" — the caller falls back to that when this is false. */
  ok: boolean;
  /** The sanitized URL, present only when ok. */
  url?: string;
  /** The host, present whenever the input parsed — useful for the host+date fallback either way. */
  host?: string;
}

/** Strip userinfo and credential/signature query parameters from a URL before it is written into
 * an item. Returns `{ ok: false }` when `raw` does not parse as an absolute URL at all. */
export function sanitizeSourceUrl(raw: string): SanitizedSource {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false };
  }
  url.username = "";
  url.password = "";
  const toDelete: string[] = [];
  for (const key of url.searchParams.keys()) {
    if (CREDENTIAL_PARAM.test(key)) toDelete.push(key);
  }
  for (const key of toDelete) url.searchParams.delete(key);
  return { ok: true, url: url.toString(), host: url.host };
}

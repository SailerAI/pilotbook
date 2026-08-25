import { createHash } from "node:crypto";

/** SHA-256 of skill bodies shipped before the protocol rewrite. Matching files may be upgraded. */
export const LEGACY_SKILL_HASHES: Record<string, string[]> = {
  implement: [
    "c4daaa868ac191cbc800d90bb9b554034852f35fb263baf933c1b6b366e012b1",
    "da4b4eec2c46d0afd3c91da3934ffcee2654bc89c2a754d754c7e7990fac2dbb",
    "2a67ec97463615abc8a6d5f83f8cdd2a8dd26a06f5242dbb2b753d4b0ad6fc0f",
  ],
  groom: ["420669018a7635e7e30b4696bd225bd9613b9feb6b6824ba4e377a6164761459"],
  prioritize: ["ac95f06ba3741b6a4dbbb513c461936da89e103918b18f44a8a3718df5bb5bdf"],
  architect: [
    "9f416e8c76c2469883a625f05f655e73ddbafbb486364b41892a7edf01d625ad",
    "ad1f3fa69831c688b109c3464c57e456515884d95535b7ecb0965fdc7194d51f",
  ],
  discover: ["514d86009e5e504b43ba0a22f553a138b7aa4e419ad9529540fd7b3546f8c016"],
  shape: ["91e824cb635596f3231219eba6a895b37dd1cbb4307e11947b7d7a9612ba729b"],
};

export function sha256Hex(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export type SkillWriteAction = "write" | "skip-exists" | "skip-edited" | "refresh";

export function skillWriteAction(
  name: string,
  dest: string | null,
  bundled: string,
  refresh: boolean,
): SkillWriteAction {
  if (dest == null) return "write";
  if (dest === bundled) return "skip-exists";
  if (!refresh) return "skip-exists";
  const legacy = LEGACY_SKILL_HASHES[name] ?? [];
  if (legacy.includes(sha256Hex(dest))) return "refresh";
  return "skip-edited";
}

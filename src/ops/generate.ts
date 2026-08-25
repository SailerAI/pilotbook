import { extractSection } from "../core/markdown.ts";
import { type OpContext, PilotbookError } from "./context.ts";
import { skillOf } from "./instructions.ts";
import { createItem } from "./items.ts";
import { profileOf } from "./profile.ts";

export const GENERATE_SKILLS = ["discover"] as const;
export type GenerateSkillName = (typeof GENERATE_SKILLS)[number];

export interface GenerateInput {
  skill: string;
  title: string;
  demand: string;
  fetch?: typeof fetch;
  env?: NodeJS.ProcessEnv;
}

export interface GenerateResult {
  skill: string;
  provider: "anthropic" | "openai";
  model: string;
  item: { id: string; type: string; title: string; path: string };
}

const IDEA_HEADINGS = [
  "Why",
  "Jobs to be done",
  "Personas",
  "Sketch",
  "Prior art",
  "Evidence",
  "Open questions",
  "Why not now",
] as const;

function envOf(input: GenerateInput): NodeJS.ProcessEnv {
  return input.env ?? process.env;
}

function detectProvider(env: NodeJS.ProcessEnv): {
  provider: "anthropic" | "openai";
  key: string;
  model: string;
} {
  const override = env.PILOTBOOK_LLM_MODEL?.trim();
  const anthropic = env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) {
    return {
      provider: "anthropic",
      key: anthropic,
      model: override || "claude-sonnet-4-20250514",
    };
  }
  const openai = env.OPENAI_API_KEY?.trim();
  if (openai) {
    return { provider: "openai", key: openai, model: override || "gpt-4o" };
  }
  throw new PilotbookError(
    "no LLM token exported",
    "missing-llm-token",
    400,
    "Use Cursor or Claude Code with `pb skill discover`, or export ANTHROPIC_API_KEY / OPENAI_API_KEY and retry `pb generate discover`.",
  );
}

function stripFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1]!.trim() : trimmed;
}

function stripFrontmatter(text: string): string {
  if (!text.startsWith("---")) return text;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return text;
  return text.slice(end + 4).replace(/^\s+/, "");
}

function ideaBodyFromModel(text: string, demand: string): string {
  const body = stripFrontmatter(stripFence(text));
  const parts: string[] = [];
  for (const heading of IDEA_HEADINGS) {
    const section = extractSection(body, heading);
    parts.push(`## ${heading}\n\n${section || `(from demand) ${demand}`}\n`);
  }
  return `${parts.join("\n").trim()}\n`;
}

async function callAnthropic(
  doFetch: typeof fetch,
  key: string,
  model: string,
  prompt: string,
): Promise<string> {
  const res = await doFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new PilotbookError(
      `anthropic HTTP ${res.status}`,
      "llm-http",
      502,
      "Check ANTHROPIC_API_KEY and PILOTBOOK_LLM_MODEL.",
    );
  }
  const json = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = json.content?.map((c) => c.text ?? "").join("\n") ?? "";
  if (!text.trim()) throw new PilotbookError("empty LLM response", "llm-empty", 502);
  return text;
}

async function callOpenAi(
  doFetch: typeof fetch,
  key: string,
  model: string,
  prompt: string,
): Promise<string> {
  const res = await doFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new PilotbookError(
      `openai HTTP ${res.status}`,
      "llm-http",
      502,
      "Check OPENAI_API_KEY and PILOTBOOK_LLM_MODEL.",
    );
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new PilotbookError("empty LLM response", "llm-empty", 502);
  return text;
}

/** Optional CLI fallback: run a shipped skill with an exported provider token. */
export async function generateSkill(ctx: OpContext, input: GenerateInput): Promise<GenerateResult> {
  const skillName = String(input.skill ?? "")
    .trim()
    .toLowerCase();
  if (!(GENERATE_SKILLS as readonly string[]).includes(skillName)) {
    throw new PilotbookError(
      `generate supports: ${GENERATE_SKILLS.join(", ")}`,
      "unsupported-generate",
      400,
      'pb generate discover --title "..." --demand "..."',
    );
  }
  const title = String(input.title ?? "").trim();
  const demand = String(input.demand ?? "").trim();
  if (!title) throw new PilotbookError("title is required");
  if (!demand) throw new PilotbookError("demand is required");

  const env = envOf(input);
  const { provider, key, model } = detectProvider(env);
  const skill = skillOf(skillName);
  const profile = profileOf(ctx);
  const prompt = [
    "Follow this Pilotbook skill. Fill an idea markdown body with the required sections.",
    "Do not invent Pilotbook IDs. Return markdown with ## Why, ## Jobs to be done, ## Personas, ## Sketch, ## Prior art, ## Evidence, ## Open questions, ## Why not now.",
    "",
    `# Skill: ${skill.name}`,
    skill.body,
    "",
    `# Repo profile`,
    JSON.stringify(profile, null, 2),
    "",
    `# Title`,
    title,
    "",
    `# Demand`,
    demand,
  ].join("\n");

  const doFetch = input.fetch ?? globalThis.fetch;
  if (typeof doFetch !== "function") {
    throw new PilotbookError("fetch is not available", "no-fetch", 500);
  }
  const text =
    provider === "anthropic"
      ? await callAnthropic(doFetch, key, model, prompt)
      : await callOpenAi(doFetch, key, model, prompt);

  const item = createItem(ctx, {
    type: "idea",
    title,
    body: ideaBodyFromModel(text, demand),
  });
  return {
    skill: skillName,
    provider,
    model,
    item: { id: item.id, type: item.type, title: String(item.data.title), path: item.rel },
  };
}

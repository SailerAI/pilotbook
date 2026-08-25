#!/usr/bin/env node
import { once } from "node:events";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand, runMain } from "citty";
import {
  analyzeGraph,
  applyClarifications,
  board,
  boardPlan,
  briefOf,
  bumpItem,
  clarifyItem,
  complete,
  completionScript,
  convergeItem,
  createItem,
  explain,
  exportItems,
  graphDot,
  hookStop,
  impactOf,
  initProject,
  installHooks,
  lintText,
  listReady,
  listSkills,
  nextReady,
  PilotbookError,
  promoteIdea,
  rejectIdea,
  searchGraph,
  seedFromBrief,
  sessionStart,
  skillOf,
  splitItem,
  startUi,
  statusOf,
  syncNotion,
  verifyItem,
  withProject,
  writeManifest,
} from "../ops/index.ts";
import { emit, printTable } from "./render.ts";

function pkgVersion(): string {
  try {
    const pkgPath = path.resolve(
      fileURLToPath(new URL(".", import.meta.url)),
      "../../package.json",
    );
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function fail(err: unknown): never {
  const json = process.argv.includes("--json");
  if (json) {
    const payload =
      err instanceof PilotbookError
        ? { error: err.message, code: err.code, ...(err.fix ? { fix: err.fix } : {}) }
        : { error: err instanceof Error ? err.message : String(err), code: "error" };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      err instanceof PilotbookError && err.fix ? `${msg}\nfix: ${err.fix}\n` : `${msg}\n`,
    );
  }
  process.exit(err instanceof PilotbookError && err.status === 404 ? 2 : 1);
}

function ctxFrom(args: object): ReturnType<typeof withProject> {
  const cwd =
    "cwd" in args && typeof (args as { cwd?: unknown }).cwd === "string"
      ? (args as { cwd: string }).cwd
      : undefined;
  return withProject(cwd);
}

const jsonArg = { json: { type: "boolean" as const, description: "JSON output", default: false } };
const cwdArg = { cwd: { type: "string" as const, description: "Working directory" } };

const main = defineCommand({
  meta: {
    name: "pilotbook",
    version: pkgVersion(),
    description:
      "Repo-native project management for AI agents. Your repo has the chart. Pilotbook has the directions.",
  },
  args: { ...jsonArg, ...cwdArg },
  subCommands: {
    init: defineCommand({
      meta: { description: "Scaffold config, directories, templates, and agent wiring" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        ai: { type: "boolean", description: "Install agent skills/rules", default: true },
      },
      run({ args }) {
        const result = initProject(
          path.resolve(typeof args.cwd === "string" ? args.cwd : process.cwd()),
          { ai: args.ai !== false },
        );
        emit(
          Boolean(args.json),
          result,
          `initialized ${result.root}\nwrote: ${result.wrote.join(", ") || "(none)"}\n`,
        );
      },
    }),
    new: defineCommand({
      meta: { description: "Create an item" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        type: {
          type: "positional",
          required: true,
          description: "epic | story | task | adr | business-rule | idea",
        },
        title: { type: "string", required: true, description: "Title" },
        epic: { type: "string", description: "Parent epic (stories)" },
        story: { type: "string", description: "Parent story (tasks)" },
        goal: { type: "string", description: "Epic goal" },
        area: { type: "string", description: "Task area" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const created = createItem(ctx, {
            type: String(args.type),
            title: String(args.title),
            epic: args.epic,
            story: args.story,
            goal: args.goal,
            area: args.area,
          });
          emit(Boolean(args.json), created, `created ${created.rel}\n`);
        } catch (err) {
          fail(err);
        }
      },
    }),
    next: defineCommand({
      meta: { description: "List unblocked work" },
      args: { ...cwdArg, json: jsonArg.json },
      run({ args }) {
        const ctx = ctxFrom(args);
        const items = nextReady(ctx);
        emit(
          Boolean(args.json),
          { items },
          items.length
            ? printTable(
                ["ID", "Type", "Phase", "Pri", "Est", "Status", "Ladder", "Title"],
                items.map((i) => [
                  i.id,
                  i.type,
                  i.phase,
                  i.priority,
                  i.estimate,
                  i.status,
                  i.ladder,
                  i.title,
                ]),
              )
            : "No unblocked backlog items.\n",
        );
      },
    }),
    status: defineCommand({
      meta: { description: "Computed ready/blocked state with requires and unlocks" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: false, description: "Item ID" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          if (!args.id) {
            const items = listReady(ctx);
            emit(
              Boolean(args.json),
              { items },
              items.length
                ? printTable(
                    ["ID", "Type", "State", "Title"],
                    items.map((i) => [i.id, i.type, i.state, i.title]),
                  )
                : "No ready items.\n",
            );
            return;
          }
          const result = statusOf(ctx, String(args.id));
          emit(
            Boolean(args.json),
            result,
            `${[
              `${result.id} state=${result.state} status=${String(result.status)}`,
              result.requires.length
                ? `requires: ${result.requires.map((r) => `${r.id} (${r.state})`).join(", ")}`
                : "requires: (none)",
              result.missingDeps.length
                ? `missing: ${result.missingDeps.join(", ")}`
                : "missing: (none)",
              result.unlocks.length
                ? `unlocks: ${result.unlocks.map((u) => `${u.id} (${u.state}) ${u.title}`).join(", ")}`
                : "unlocks: (none)",
            ].join("\n")}\n`,
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    search: defineCommand({
      meta: { description: "Search item ids, titles, and bodies" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        q: { type: "positional", required: true, description: "Query" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const items = searchGraph(ctx, String(args.q ?? ""));
          emit(
            Boolean(args.json),
            { items },
            items.length
              ? printTable(
                  ["ID", "Type", "Title", "Snippet"],
                  items.map((i) => [i.id, i.type, i.title, i.snippet]),
                )
              : "No matches.\n",
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    brief: defineCommand({
      meta: { description: "Compile the context pack for an item" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true, description: "Item ID" },
        budget: { type: "string", description: "Token budget" },
        format: { type: "string", description: "md | json", default: "md" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const budget = args.budget ? Number(args.budget) : undefined;
          const result = briefOf(ctx, String(args.id), { budget });
          if (args.json || args.format === "json") emit(true, result.brief, "");
          else process.stdout.write(result.text);
        } catch (err) {
          fail(err);
        }
      },
    }),
    instructions: defineCommand({
      meta: { description: "List shipped skills (progressive disclosure)" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        topic: { type: "positional", required: false, description: "overview (default)" },
      },
      run({ args }) {
        try {
          const topic = args.topic == null || args.topic === "" ? "overview" : String(args.topic);
          if (topic !== "overview") {
            fail(
              new PilotbookError(
                `unknown instructions topic: ${topic}`,
                "unknown-topic",
                400,
                "pb instructions overview",
              ),
            );
          }
          const skills = listSkills();
          emit(
            Boolean(args.json),
            skills,
            printTable(
              ["Name", "Description"],
              skills.map((s) => [s.name, s.description]),
            ),
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    skill: defineCommand({
      meta: { description: "Print one shipped skill body" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        name: { type: "positional", required: true, description: "Skill name" },
      },
      run({ args }) {
        try {
          const skill = skillOf(String(args.name));
          if (args.json) emit(true, skill, "");
          else process.stdout.write(skill.body.endsWith("\n") ? skill.body : `${skill.body}\n`);
        } catch (err) {
          fail(err);
        }
      },
    }),
    lint: defineCommand({
      meta: { description: "Validate the graph" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        format: { type: "string", description: "text | github", default: "text" },
      },
      run({ args }) {
        const ctx = ctxFrom(args);
        const format = args.format === "github" ? "github" : "text";
        const out = lintText(ctx, format);
        if (args.json) emit(true, out.result, "");
        else process.stdout.write(out.text);
        process.exit(out.ok ? 0 : 1);
      },
    }),
    board: defineCommand({
      meta: { description: "Regenerate BOARD.md" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        "dry-run": {
          type: "boolean",
          description: "Report added and orphan ids without writing",
          default: false,
        },
      },
      run({ args }) {
        const ctx = ctxFrom(args);
        if (args["dry-run"]) {
          const plan = boardPlan(ctx);
          const added =
            plan.added.length === 0
              ? "(none)"
              : plan.added.map((a) => `${a.id} (${a.status})`).join(", ");
          const orphans =
            plan.orphans.length === 0
              ? "(none)"
              : plan.orphans.map((o) => `${o.id} (${o.status})`).join(", ");
          emit(
            Boolean(args.json),
            plan,
            `in_sync: ${plan.inSync}\nadded: ${added}\norphans: ${orphans}\n`,
          );
          return;
        }
        const result = board(ctx);
        emit(Boolean(args.json), result, `wrote ${result.wrote}\n`);
      },
    }),
    explain: defineCommand({
      meta: { description: "Why an item is blocked / what it blocks" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const result = explain(ctx, String(args.id));
          emit(
            Boolean(args.json),
            result,
            `${[
              `${result.id} status=${String(result.status)}`,
              result.parent ? `parent: ${result.parent}` : "",
              result.blockedBy.length
                ? `blocked by: ${result.blockedBy.join(", ")}`
                : "blocked by: (none)",
              result.blocks.length ? `blocks: ${result.blocks.join(", ")}` : "blocks: (none)",
              result.children.length ? `children: ${result.children.join(", ")}` : "",
              ...result.notes,
            ]
              .filter(Boolean)
              .join("\n")}\n`,
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    graph: defineCommand({
      meta: { description: "Print the graph as Graphviz DOT" },
      args: { ...cwdArg, json: jsonArg.json, dot: { type: "boolean", default: true } },
      run({ args }) {
        const ctx = ctxFrom(args);
        const dot = graphDot(ctx);
        emit(Boolean(args.json), { dot }, dot);
      },
    }),
    verify: defineCommand({
      meta: { description: "Run checks and stamp verified frontmatter" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true },
        force: { type: "boolean", default: false },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const result = verifyItem(ctx, String(args.id), { force: Boolean(args.force) });
          emit(
            Boolean(args.json),
            result,
            `verified ${result.id} hash=${result.hash}${result.bypassed ? " (bypassed)" : ""}\n`,
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    ui: defineCommand({
      meta: { description: "Open the local board (loopback only)" },
      args: {
        ...cwdArg,
        port: { type: "string", description: "Port", default: "4173" },
        open: { type: "boolean", description: "Open the browser", default: true },
      },
      async run({ args }) {
        const port = Number(args.port || 4173);
        const { spawn } = await import("node:child_process");
        const server = startUi({
          port,
          cwd: typeof args.cwd === "string" ? args.cwd : undefined,
        });
        try {
          await once(server, "listening");
        } catch (err) {
          fail(err);
        }
        const url = `http://127.0.0.1:${port}`;
        process.stdout.write(
          `Pilotbook UI ${url}\nReads and writes markdown under the project. Ctrl+C to stop.\n`,
        );
        if (args.open !== false) {
          const opener =
            process.platform === "darwin"
              ? "open"
              : process.platform === "win32"
                ? "cmd"
                : "xdg-open";
          const openerArgs = process.platform === "win32" ? ["/c", "start", "", url] : [url];
          spawn(opener, openerArgs, { stdio: "ignore", detached: true }).unref();
        }
        await new Promise<void>(() => {
          /* keep the process alive until SIGINT */
        });
      },
    }),
    mcp: defineCommand({
      meta: { description: "Run the MCP server on stdio" },
      args: { ...cwdArg },
      async run({ args }) {
        const { runMcp } = await import("../mcp/index.ts");
        await runMcp(args.cwd);
      },
    }),
    export: defineCommand({
      meta: { description: "One-way export to Jira or Notion" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        to: { type: "string", required: true, description: "jira | notion" },
        "dry-run": { type: "boolean", default: true },
      },
      async run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const to = args.to === "notion" ? "notion" : "jira";
          const result = await exportItems(ctx, to, { dryRun: args["dry-run"] !== false });
          emit(
            Boolean(args.json),
            result,
            `${result.dryRun ? "dry-run " : ""}export ${result.target}: ${result.items.length} items\n`,
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    sync: defineCommand({
      meta: { description: "Two-way Notion sync (provision, push, pull, intake)" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        init: { type: "boolean", default: false, description: "Create Notion databases" },
        to: { type: "string", description: "notion — push markdown to Notion" },
        from: { type: "string", description: "notion — pull Notion into markdown" },
        "dry-run": { type: "boolean", default: true },
      },
      async run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const toNotion = args.to === "notion";
          const fromNotion = args.from === "notion";
          const result = await syncNotion(ctx, {
            init: Boolean(args.init),
            ...(toNotion || fromNotion ? { to: toNotion, from: fromNotion } : {}),
            dryRun: args["dry-run"] !== false,
          });
          const summary = result.actions.length
            ? result.actions.map((a) => `${a.action}\t${a.side}\t${a.id}`).join("\n")
            : "(no actions)";
          emit(
            Boolean(args.json),
            result,
            `${result.dryRun ? "dry-run " : ""}sync init=${result.init} to=${result.to} from=${result.from}\n${summary}\n`,
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    promote: defineCommand({
      meta: { description: "Promote an idea to an epic or story" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true, description: "Idea ID" },
        to: { type: "string", required: true, description: "epic | story" },
        title: { type: "string", required: true, description: "Title of the new item" },
        epic: { type: "string", description: "Parent epic (when --to story)" },
        "dry-run": { type: "boolean", default: false },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const to = String(args.to);
          if (to !== "epic" && to !== "story") {
            fail(new PilotbookError("to must be epic or story", "invalid-to"));
          }
          const result = promoteIdea(ctx, String(args.id), {
            to,
            title: String(args.title),
            epic: typeof args.epic === "string" ? args.epic : undefined,
            dryRun: Boolean(args["dry-run"]),
          });
          const text = result.dryRun
            ? `would create ${result.type} "${result.title}"${result.epic ? ` under ${result.epic}` : ""}\n`
            : `promoted ${args.id} → ${result.created?.id}\n`;
          emit(Boolean(args.json), result, text);
        } catch (err) {
          fail(err);
        }
      },
    }),
    bump: defineCommand({
      meta: { description: "Increment version, set amended, refresh content_hash" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true, description: "BR or ADR ID" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const result = bumpItem(ctx, String(args.id));
          const text = result.bumped
            ? `bumped ${result.id} version=${result.version} amended=${result.amended}\n`
            : `warning: ${result.warning}\n`;
          emit(Boolean(args.json), result, text);
        } catch (err) {
          fail(err);
        }
      },
    }),
    impact: defineCommand({
      meta: { description: "List stories and tasks that cite a rule or ADR" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true, description: "BR or ADR ID" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const result = impactOf(ctx, String(args.id));
          emit(
            Boolean(args.json),
            result,
            result.items.length
              ? `${result.id} v${result.version}\n${printTable(
                  ["ID", "Type", "Status", "Done", "Title"],
                  result.items.map((i) => [
                    i.id,
                    i.type,
                    String(i.status ?? ""),
                    i.done ? "yes" : "",
                    i.title,
                  ]),
                )}`
              : `${result.id} v${result.version}\nNo inbound stories or tasks.\n`,
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    analyze: defineCommand({
      meta: { description: "Report graph coverage gaps without an LLM" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
      },
      run({ args }) {
        const ctx = ctxFrom(args);
        const result = analyzeGraph(ctx);
        emit(
          Boolean(args.json),
          result,
          `${printTable(
            ["Requirement Key", "Has Task?", "Task IDs", "Proved?", "Test", "Notes"],
            result.coverage.map((row) => [
              row.key,
              row.hasTask ? "yes" : "no",
              row.taskIds.join(", "),
              row.key.includes("#") ? (row.proved ? "yes" : "no") : "",
              row.test ?? "",
              row.notes,
            ]),
          )}coverage ${result.coveragePercent}%\nproved ${result.provedPercent}%\n${result.ok ? "analyze ok" : "analyze failed"}\n`,
        );
        process.exit(result.ok ? 0 : 1);
      },
    }),
    converge: defineCommand({
      meta: { description: "Append tasks for uncovered acceptance criteria" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true, description: "Story or epic ID" },
        "dry-run": {
          type: "boolean",
          description: "Report converged or a plan of tasks without writing",
          default: false,
        },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const result = convergeItem(ctx, String(args.id), {
            dryRun: Boolean(args["dry-run"]),
          });
          const text =
            result.status === "plan"
              ? `plan ${result.id}\n${result.tasks
                  .map((t) => `task\t${t.title}\t${t.covers.join(",")}`)
                  .join("\n")}\n`
              : result.created.length
                ? `converged ${result.id}\n${result.created
                    .map((c) => `${c.id}\t${String(c.data.title)}`)
                    .join("\n")}\n`
                : "converged\n";
          emit(Boolean(args.json), result, text);
        } catch (err) {
          fail(err);
        }
      },
    }),
    split: defineCommand({
      meta: { description: "Split an oversized item into children" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true, description: "Epic, story, or task ID" },
        "dry-run": { type: "boolean", default: false },
        epic: { type: "string", description: "Parent epic (parentless task split)" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const result = splitItem(ctx, String(args.id), {
            dryRun: Boolean(args["dry-run"]),
            epic: typeof args.epic === "string" ? args.epic : undefined,
          });
          const text = result.dryRun
            ? `split ${result.id} recommended=${result.recommended_count}\n${result.children
                .map((c) => `${c.type}\t${c.title}${c.area ? `\t${c.area}` : ""}`)
                .join("\n")}\n`
            : `split ${result.id}\n${result.created.map((c) => `${c.type}\t${c.id ?? "-"}\t${c.title}`).join("\n")}\n`;
          emit(Boolean(args.json), result, text);
        } catch (err) {
          fail(err);
        }
      },
    }),
    reject: defineCommand({
      meta: { description: "Record a kill verdict on an idea" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true, description: "Idea ID" },
        reason: { type: "string", required: true, description: "Why this is not worth building" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const result = rejectIdea(ctx, String(args.id), { reason: String(args.reason) });
          emit(Boolean(args.json), result, `rejected ${result.id}\n`);
        } catch (err) {
          fail(err);
        }
      },
    }),
    clarify: defineCommand({
      meta: { description: "Detect or apply a bounded clarification set" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        id: { type: "positional", required: true, description: "Item ID" },
        answers: { type: "string", description: "JSON array of { question, option, text }" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const id = String(args.id);
          if (args.answers) {
            let parsed: unknown;
            try {
              parsed = JSON.parse(String(args.answers));
            } catch {
              fail(new PilotbookError("answers must be valid JSON"));
            }
            const result = applyClarifications(ctx, id, parsed);
            emit(
              Boolean(args.json),
              result,
              result.applied.length
                ? `clarified ${id}: ${result.applied.map((a) => a.kind).join(", ")}\n`
                : `${id} unchanged\n`,
            );
            return;
          }
          const result = clarifyItem(ctx, id);
          const text = result.ready
            ? `${id} is ready. Nothing to clarify.\n`
            : `${id} needs clarification:\n${result.questions
                .map(
                  (q, i) =>
                    `${i + 1}. [${q.id}] ${q.prompt}\n${q.options
                      .map((o) => `   - ${o.id}: ${o.label}`)
                      .join("\n")}`,
                )
                .join("\n")}\n`;
          emit(Boolean(args.json), result, text);
        } catch (err) {
          fail(err);
        }
      },
    }),
    seed: defineCommand({
      meta: { description: "Materialize a brief.md into epics, stories, and tasks" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        from: { type: "string", required: true, description: "Path to brief markdown" },
        "dry-run": { type: "boolean", default: false },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const md = readFileSync(path.resolve(String(args.from)), "utf8");
          const result = seedFromBrief(ctx, md, { dryRun: Boolean(args["dry-run"]) });
          emit(
            Boolean(args.json),
            result,
            `${result.created.map((c) => `${c.type}\t${c.id ?? "-"}\t${c.title}`).join("\n")}\n`,
          );
        } catch (err) {
          fail(err);
        }
      },
    }),
    manifest: defineCommand({
      meta: { description: "Write .pb/graph.json for cross-repo refs" },
      args: { ...cwdArg, json: jsonArg.json },
      run({ args }) {
        const ctx = ctxFrom(args);
        const result = writeManifest(ctx);
        emit(Boolean(args.json), result.manifest, `wrote ${result.wrote}\n`);
      },
    }),
    hook: defineCommand({
      meta: { description: "Agent hook helpers" },
      args: {
        ...cwdArg,
        json: jsonArg.json,
        action: {
          type: "positional",
          required: true,
          description: "install | session-start | stop",
        },
      },
      run({ args }) {
        const ctx = ctxFrom(args);
        const action = String(args.action);
        if (action === "install") {
          const result = installHooks(ctx);
          emit(Boolean(args.json), result, `hooks: ${result.wrote.join(", ")}\n`);
          return;
        }
        if (action === "session-start") {
          const text = sessionStart(ctx);
          emit(Boolean(args.json), { text }, text);
          return;
        }
        if (action === "stop") {
          const result = hookStop(ctx);
          emit(Boolean(args.json), result, `${result.message}\n`);
          process.exit(result.ok ? 0 : 2);
        }
        fail(new PilotbookError(`unknown hook action: ${action}`));
      },
    }),
    completions: defineCommand({
      meta: { description: "Print a shell completion script" },
      args: {
        shell: { type: "positional", required: true, description: "zsh | bash | fish" },
      },
      run({ args }) {
        const shell = String(args.shell);
        if (shell !== "zsh" && shell !== "bash" && shell !== "fish")
          fail(new Error("shell must be zsh, bash, or fish"));
        process.stdout.write(completionScript(shell));
      },
    }),
    _complete: defineCommand({
      meta: { description: "Hidden completion resolver" },
      args: {
        ...cwdArg,
        rest: { type: "positional", description: "tokens" },
      },
      run({ args }) {
        try {
          const ctx = ctxFrom(args);
          const tokens = process.argv
            .slice(process.argv.indexOf("_complete") + 1)
            .filter((t) => t !== "--");
          const hits = complete(ctx, tokens);
          for (const h of hits) process.stdout.write(`${h.value}\t${h.description ?? ""}\n`);
        } catch {
          // completion must never crash the shell
        }
      },
    }),
  },
});

runMain(main);

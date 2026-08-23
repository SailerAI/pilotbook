import pc from "picocolors";
import type { Diagnostic } from "../core/types.ts";

export function printTable(
  headers: string[],
  rows: Array<Array<string | number | unknown>>,
): string {
  const lines = [headers.join("\t")];
  for (const row of rows) lines.push(row.map((c) => String(c ?? "")).join("\t"));
  return `${lines.join("\n")}\n`;
}

export function printDiagnostics(errors: Diagnostic[], warnings: Diagnostic[]): string {
  const out: string[] = [];
  for (const w of warnings)
    out.push(pc.yellow(`warn: ${w.file}:${w.line}:${w.column} ${w.code} ${w.message}`));
  for (const e of errors)
    out.push(pc.red(`error: ${e.file}:${e.line}:${e.column} ${e.code} ${e.message}`));
  return out.join("\n") + (out.length ? "\n" : "");
}

export function emit(jsonFlag: boolean, data: unknown, text: string): void {
  if (jsonFlag) process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  else process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
}

export type Severity = "error" | "warning";

export interface Position {
  line: number;
  column: number;
}

export interface Diagnostic {
  code: string;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column: number;
  /** Work-item ID the diagnostic is about, when it is not file-local. */
  target?: string;
  suggestion?: string;
  fix?: string;
}

export interface FieldPos {
  [key: string]: Position;
}

export type Scalar = string | number | boolean;
export type FrontmatterValue =
  | Scalar
  | Scalar[]
  | Record<string, Scalar | Scalar[] | undefined>
  | undefined;

export interface ItemData {
  id: string;
  title: string;
  type: string;
  [key: string]: FrontmatterValue;
}

export interface TypeConfig {
  dir: string;
  prefix: string;
  pad: number;
  group: string;
  required: string[];
  /** Known keys that are not required. `unknown-field` allows these. */
  optional: string[];
  enums: Record<string, string[]>;
  arrays: string[];
  numbers: string[];
  dates: string[];
  objects: string[];
  /** Parent type name; field name equals the parent type (epic, story). */
  parent?: string;
  template: string;
  idPattern: RegExp;
}

export interface EdgeKind {
  to: string[];
  blocking: boolean;
  acyclic: boolean;
  /** If set, this edge is a single scalar field rather than an array. */
  scalar?: boolean;
}

export interface PeerManifestRef {
  name: string;
  manifest: string;
}

export interface VerifiedBlock {
  at: string;
  checks: string[];
  hash: string;
  bypassed?: boolean;
}

export interface PilotbookConfig {
  name: string;
  root: string;
  board: string;
  cacheDir: string;
  types: Record<string, TypeConfig>;
  edges: Record<string, EdgeKind>;
  codeMap: Record<string, string[]>;
  checks: { commands: string[] };
  hooks: { blockOnUnverified: boolean; primeBudget: number };
  peers: PeerManifestRef[];
}

export interface ParsedItem {
  type: string;
  rel: string;
  abs: string;
  data: ItemData;
  body: string;
  positions: FieldPos;
  mtimeMs: number;
}

export interface PublicItem {
  id: string;
  type: string;
  rel: string;
  data: ItemData;
  body: string;
}

export interface GraphIndex {
  items: ParsedItem[];
  byId: Map<string, ParsedItem>;
  errors: Diagnostic[];
}

export interface PeerItem {
  id: string;
  type: string;
  title: string;
  status?: string;
  repo: string;
}

export interface LoadedProject {
  projectRoot: string;
  configPath: string | null;
  config: PilotbookConfig;
  index: GraphIndex;
  peers: Map<string, PeerItem[]>;
}

export const DATE_RE: RegExp = /^\d{4}-\d{2}-\d{2}$/;
export const WORK_TYPES: readonly string[] = ["epic", "story", "task"];
export const BACKLOG_STATUS: readonly string[] = [
  "backlog",
  "todo",
  "in-progress",
  "review",
  "blocked",
  "done",
  "cancelled",
];
export const PRIORITIES: readonly string[] = ["P0", "P1", "P2", "P3"];
export const AREAS: readonly string[] = ["backend", "frontend", "db", "infra", "docs"];
export const ADR_STATUS: readonly string[] = [
  "proposed",
  "accepted",
  "rejected",
  "superseded",
  "deprecated",
];
export const BR_STATUS: readonly string[] = ["draft", "active", "deprecated"];
export const IDEA_STATUS: readonly string[] = ["raw", "exploring", "promoted", "rejected"];
export const SIZE: readonly string[] = ["low", "medium", "high", "large"];

/* The Blueprint Builder engines (builder/engine/*.js), run on the server
   exactly as they run in the browser: pure functions, no DOM, no storage.
   The server uses them to check every saved project and to produce the
   submitted blueprint and developer handover itself, so what BPC receives
   never depends on what the browser claims. */

// Plain JS engines (allowJs); their inferred types are narrowed to the APIs below.
import ProjectEngine from '../../builder/engine/project.js';
import DocumentsEngine from '../../builder/engine/documents.js';
import ConnectionsEngine from '../../builder/engine/connections.js';
import categoriesFile from '../../builder/modules/categories.json';
import audit from '../../builder/modules/audit.json';
import configure from '../../builder/modules/configure.json';
import connect from '../../builder/modules/connect.json';
import connectTools from '../../builder/modules/connect_tools.json';
import custom from '../../builder/modules/custom.json';
import plan from '../../builder/modules/plan.json';
import quote from '../../builder/modules/quote.json';
import selectRecommend from '../../builder/modules/select_recommend.json';

/** A Blueprint Builder project record (schema bpc.project/1). Only the parts
 *  the server reads are typed; everything else passes through untouched. */
export type BuilderProject = {
  schema: string;
  id: string;
  name: string;
  description?: string;
  version?: number;
  updated?: string;
  tools: unknown[];
  reviews?: Record<string, ProjectReview>;
  comments?: Record<string, ProjectComment[]>;
  events?: unknown[];
  [k: string]: unknown;
};
export type ProjectReview = {
  client?: { at: string; hash: string; text?: string };
  bpc?: { at: string; hash: string };
  clarify?: { at: string; text: string; resolved: boolean };
};
export type ProjectComment = { at: string; by: 'client' | 'bpc'; doc?: string; text: string };

type Doc = { id: string; title: string; md: string; state: string; stateLabel: string };

type ProjectApi = {
  deserialise(text: string, modules: unknown): BuilderProject;
  newProject(at?: string): BuilderProject;
  impliedAcrossTools(p: BuilderProject, modules: unknown, cats: unknown): unknown[];
  addTool(p: BuilderProject, cats: unknown, modules: unknown, opts: Record<string, unknown>): { id: string };
};
type DocumentsApi = {
  documentSet(p: BuilderProject, ctx: unknown): Doc[];
  handover(p: BuilderProject, ctx: unknown): Record<string, unknown>;
  approve(p: BuilderProject, d: Doc, by: 'client' | 'bpc', at?: string): void;
  requestClarification(p: BuilderProject, d: Doc, text: string, at?: string): void;
  comment(p: BuilderProject, item: string, doc: string, by: 'client' | 'bpc', text: string, at?: string): void;
};
type ConnectionsApi = { demoProject(Project: ProjectApi, cats: unknown, modules: unknown, at?: string): BuilderProject };

export const Project = ProjectEngine as ProjectApi;
export const Documents = DocumentsEngine as DocumentsApi;
const Connections = ConnectionsEngine as ConnectionsApi;

const CATS = (categoriesFile as { categories: unknown[] }).categories;
const SIGNALS = (categoriesFile as { signals?: unknown[] }).signals ?? [];
export const MODULES: Record<string, unknown> = {
  select_recommend: selectRecommend,
  configure,
  plan,
  quote,
  connect,
  audit,
  custom,
  connect_tools: connectTools,
};

/** The same context object the app shell builds (ui/app.js CTX). */
export const CTX = {
  modules: MODULES,
  categories: CATS,
  signals: SIGNALS,
  implied: (p: BuilderProject) => Project.impliedAcrossTools(p, MODULES, CATS),
};

export class ProjectError extends Error {}

/**
 * Parse and check a project the way the app does when it opens a file, then
 * make sure the document generator can read it. Returns the normalised
 * project; throws ProjectError with a client-safe message otherwise.
 */
export function readProject(raw: unknown): BuilderProject {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ProjectError('The project is missing.');
  const r = raw as Record<string, unknown>;
  const shapes: [string, (v: unknown) => boolean][] = [
    ['name', (v) => v === undefined || typeof v === 'string'],
    ['description', (v) => v === undefined || typeof v === 'string'],
    ['tools', (v) => Array.isArray(v) && v.every((t) => !!t && typeof t === 'object' && !Array.isArray(t))],
    ['reviews', (v) => v === undefined || isPlainObject(v)],
    ['comments', (v) => v === undefined || (isPlainObject(v) && Object.values(v as object).every(Array.isArray))],
    ['events', (v) => v === undefined || Array.isArray(v)],
  ];
  for (const [k, ok] of shapes) if (!ok(r[k])) throw new ProjectError(`The project's ${k} could not be read.`);
  let p: BuilderProject;
  try {
    p = Project.deserialise(JSON.stringify({ ...r, name: r.name ?? '', description: r.description ?? '' }), MODULES);
  } catch (e) {
    throw new ProjectError(e instanceof Error ? e.message : 'The project could not be read.');
  }
  try {
    Documents.documentSet(p, CTX);
  } catch {
    throw new ProjectError('The project could not be turned into documents.');
  }
  return p;
}

function isPlainObject(v: unknown): boolean {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** The full blueprint as one Markdown file, in the same form as the app's
 *  "Full blueprint (.md)" export. */
export function blueprintMarkdown(p: BuilderProject, date: Date = new Date()): string {
  const docs = Documents.documentSet(p, CTX);
  return (
    `# Blueprint: ${p.name || 'Untitled'}\n\nVersion ${p.version ?? 1}, ${date.toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}\n\n` +
    docs.map((d) => `${d.md}\n\n_State: ${d.stateLabel} (${d.id})_`).join('\n\n---\n\n')
  );
}

export function projectHandover(p: BuilderProject): Record<string, unknown> {
  return Documents.handover(p, CTX);
}

export function documentStates(p: BuilderProject): { total: number; byState: Record<string, number> } {
  const docs = Documents.documentSet(p, CTX);
  const byState: Record<string, number> = {};
  for (const d of docs) byState[d.state] = (byState[d.state] ?? 0) + 1;
  return { total: docs.length, byState };
}

/** The populated three-tool project the app offers as a demo; used by tests. */
export function demoProject(at?: string): BuilderProject {
  return Connections.demoProject(Project, CATS, MODULES, at);
}

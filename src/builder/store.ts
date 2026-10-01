/* Storage for Blueprint Builder, in the `builder` Postgres schema (created by
   the Payload migration add_builder). The API talks to the BuilderStore
   interface; handlers are tested against the in-memory version in
   testing.ts, and this file is the Neon implementation. */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import type { BuilderProject } from './engines';

export type Client = { id: string; email: string };
export type ProjectRow = {
  id: string;
  clientId: string;
  clientEmail: string;
  name: string;
  rev: number;
  data: BuilderProject;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
};
export type ProjectSummary = Pick<ProjectRow, 'id' | 'name' | 'rev' | 'createdAt' | 'updatedAt' | 'submittedAt'>;
export type SubmissionInput = {
  projectId: string;
  rev: number;
  projectName: string;
  clientEmail: string;
  data: BuilderProject;
  handover: Record<string, unknown>;
  markdown: string;
  emailStatus: string;
  emailIds: string[];
};
export type RecentProject = ProjectSummary & { clientEmail: string; submissions: number };

export interface BuilderStore {
  /** Count one hit on `key` in the current fixed window; returns the count so far. */
  hit(key: string, windowSeconds: number): Promise<number>;
  saveLoginToken(hash: string, email: string, expiresAt: Date): Promise<void>;
  /** Marks the token used and returns its email, only if unused and unexpired. */
  consumeLoginToken(hash: string, now: Date): Promise<string | null>;
  upsertClient(email: string, now: Date): Promise<Client>;
  getClient(id: string): Promise<Client | null>;
  deleteClient(id: string): Promise<void>;
  listProjects(clientId: string): Promise<ProjectSummary[]>;
  countProjects(clientId: string): Promise<number>;
  createProject(p: { id: string; clientId: string; name: string; data: BuilderProject }, now: Date): Promise<ProjectRow>;
  getProject(id: string): Promise<ProjectRow | null>;
  /** Saves only if the stored rev is still `baseRev`; null otherwise. */
  updateProject(id: string, baseRev: number, name: string, data: BuilderProject, now: Date): Promise<ProjectRow | null>;
  deleteProject(id: string): Promise<void>;
  addSubmission(s: SubmissionInput, now: Date): Promise<number>;
  /** For the CMS dashboard. */
  recentProjects(limit: number): Promise<RecentProject[]>;
  counts(): Promise<{ clients: number; projects: number; submitted: number }>;
}

export function neonStore(url: string = process.env.DATABASE_URL ?? ''): BuilderStore {
  if (!url) throw new Error('DATABASE_URL is not set.');
  const q: NeonQueryFunction<false, false> = neon(url);
  type Row = Record<string, unknown>;
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
  const toSummary = (r: Row): ProjectSummary => ({
    id: String(r.id),
    name: String(r.name ?? ''),
    rev: Number(r.rev),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    submittedAt: r.submitted_at ? iso(r.submitted_at) : null,
  });
  const toRow = (r: Row): ProjectRow => ({
    ...toSummary(r),
    clientId: String(r.client_id),
    clientEmail: String(r.email ?? ''),
    data: r.data as BuilderProject,
  });

  return {
    async hit(key, windowSeconds) {
      const rows = await q`
        INSERT INTO builder.rate_limits (key, window_start, count)
        VALUES (${key}, to_timestamp(floor(extract(epoch FROM now()) / ${windowSeconds}) * ${windowSeconds}), 1)
        ON CONFLICT (key, window_start) DO UPDATE SET count = builder.rate_limits.count + 1
        RETURNING count`;
      // Housekeeping, cheap and rare enough to do inline.
      if (Math.random() < 0.02) {
        await q`DELETE FROM builder.rate_limits WHERE window_start < now() - interval '2 days'`;
        await q`DELETE FROM builder.login_tokens WHERE expires_at < now() - interval '1 day'`;
      }
      return Number((rows[0] as Row).count);
    },
    async saveLoginToken(hash, email, expiresAt) {
      await q`INSERT INTO builder.login_tokens (token_hash, email, expires_at) VALUES (${hash}, ${email}, ${expiresAt.toISOString()})`;
    },
    async consumeLoginToken(hash, now) {
      const rows = await q`
        UPDATE builder.login_tokens SET used_at = ${now.toISOString()}
        WHERE token_hash = ${hash} AND used_at IS NULL AND expires_at > ${now.toISOString()}
        RETURNING email`;
      return rows.length ? String((rows[0] as Row).email) : null;
    },
    async upsertClient(email, now) {
      const rows = await q`
        INSERT INTO builder.clients (email, last_sign_in_at) VALUES (${email}, ${now.toISOString()})
        ON CONFLICT (email) DO UPDATE SET last_sign_in_at = EXCLUDED.last_sign_in_at
        RETURNING id, email`;
      const r = rows[0] as Row;
      return { id: String(r.id), email: String(r.email) };
    },
    async getClient(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      const rows = await q`SELECT id, email FROM builder.clients WHERE id = ${id}`;
      const r = rows[0] as Row | undefined;
      return r ? { id: String(r.id), email: String(r.email) } : null;
    },
    async deleteClient(id) {
      await q`DELETE FROM builder.clients WHERE id = ${id}`;
    },
    async listProjects(clientId) {
      const rows = await q`
        SELECT id, name, rev, created_at, updated_at, submitted_at FROM builder.projects
        WHERE client_id = ${clientId} ORDER BY updated_at DESC`;
      return (rows as Row[]).map(toSummary);
    },
    async countProjects(clientId) {
      const rows = await q`SELECT count(*)::int AS n FROM builder.projects WHERE client_id = ${clientId}`;
      return Number((rows[0] as Row).n);
    },
    async createProject(p, now) {
      const rows = await q`
        INSERT INTO builder.projects (id, client_id, name, rev, data, created_at, updated_at)
        VALUES (${p.id}, ${p.clientId}, ${p.name}, 1, ${JSON.stringify(p.data)}::jsonb, ${now.toISOString()}, ${now.toISOString()})
        RETURNING id, client_id, name, rev, data, created_at, updated_at, submitted_at,
          (SELECT email FROM builder.clients WHERE id = ${p.clientId}) AS email`;
      return toRow(rows[0] as Row);
    },
    async getProject(id) {
      const rows = await q`
        SELECT p.id, p.client_id, p.name, p.rev, p.data, p.created_at, p.updated_at, p.submitted_at, c.email
        FROM builder.projects p JOIN builder.clients c ON c.id = p.client_id WHERE p.id = ${id}`;
      return rows.length ? toRow(rows[0] as Row) : null;
    },
    async updateProject(id, baseRev, name, data, now) {
      const rows = await q`
        UPDATE builder.projects SET name = ${name}, data = ${JSON.stringify(data)}::jsonb, rev = rev + 1, updated_at = ${now.toISOString()}
        WHERE id = ${id} AND rev = ${baseRev}
        RETURNING id, client_id, name, rev, data, created_at, updated_at, submitted_at,
          (SELECT email FROM builder.clients WHERE id = client_id) AS email`;
      return rows.length ? toRow(rows[0] as Row) : null;
    },
    async deleteProject(id) {
      await q`DELETE FROM builder.projects WHERE id = ${id}`;
    },
    async addSubmission(s, now) {
      const rows = await q`
        INSERT INTO builder.submissions (project_id, rev, project_name, client_email, data, handover, markdown, email_status, email_ids, created_at)
        VALUES (${s.projectId}, ${s.rev}, ${s.projectName}, ${s.clientEmail}, ${JSON.stringify(s.data)}::jsonb,
          ${JSON.stringify(s.handover)}::jsonb, ${s.markdown}, ${s.emailStatus}, ${JSON.stringify(s.emailIds)}::jsonb, ${now.toISOString()})
        RETURNING id`;
      await q`UPDATE builder.projects SET submitted_at = ${now.toISOString()} WHERE id = ${s.projectId}`;
      return Number((rows[0] as Row).id);
    },
    async recentProjects(limit) {
      const rows = await q`
        SELECT p.id, p.name, p.rev, p.created_at, p.updated_at, p.submitted_at, c.email,
          (SELECT count(*)::int FROM builder.submissions s WHERE s.project_id = p.id) AS submissions
        FROM builder.projects p JOIN builder.clients c ON c.id = p.client_id
        ORDER BY p.submitted_at DESC NULLS LAST, p.updated_at DESC LIMIT ${limit}`;
      return (rows as Row[]).map((r) => ({ ...toSummary(r), clientEmail: String(r.email), submissions: Number(r.submissions) }));
    },
    async counts() {
      const rows = await q`
        SELECT (SELECT count(*)::int FROM builder.clients) AS clients,
               (SELECT count(*)::int FROM builder.projects) AS projects,
               (SELECT count(*)::int FROM builder.projects WHERE submitted_at IS NOT NULL) AS submitted`;
      const r = rows[0] as Row;
      return { clients: Number(r.clients), projects: Number(r.projects), submitted: Number(r.submitted) };
    },
  };
}

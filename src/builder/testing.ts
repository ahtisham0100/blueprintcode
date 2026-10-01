/* In-memory BuilderStore and a recording mailer, for the API tests. Mirrors
   the SQL in store.ts, including the rev check and the cascade on delete. */

import type { Mail, Mailer } from './mail';
import type { BuilderStore, Client, ProjectRow, SubmissionInput } from './store';

export function memoryStore() {
  const clients = new Map<string, Client>();
  const tokens = new Map<string, { email: string; expiresAt: Date; usedAt: Date | null }>();
  const projects = new Map<string, Omit<ProjectRow, 'clientEmail'>>();
  const submissions: (SubmissionInput & { id: number; at: Date })[] = [];
  const hits = new Map<string, number>();
  let n = 0;
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
  const withEmail = (p: Omit<ProjectRow, 'clientEmail'>): ProjectRow => clone({ ...p, clientEmail: clients.get(p.clientId)?.email ?? '' });

  const store: BuilderStore = {
    async hit(key) {
      const c = (hits.get(key) ?? 0) + 1;
      hits.set(key, c);
      return c;
    },
    async saveLoginToken(hash, email, expiresAt) {
      tokens.set(hash, { email, expiresAt, usedAt: null });
    },
    async consumeLoginToken(hash, now) {
      const t = tokens.get(hash);
      if (!t || t.usedAt || t.expiresAt <= now) return null;
      t.usedAt = now;
      return t.email;
    },
    async upsertClient(email) {
      const found = [...clients.values()].find((c) => c.email === email);
      if (found) return { ...found };
      const c = { id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, email };
      clients.set(c.id, c);
      return { ...c };
    },
    async getClient(id) {
      const c = clients.get(id);
      return c ? { ...c } : null;
    },
    async deleteClient(id) {
      clients.delete(id);
      for (const [pid, p] of projects) if (p.clientId === id) projects.delete(pid);
    },
    async listProjects(clientId) {
      return [...projects.values()]
        .filter((p) => p.clientId === clientId)
        .map(({ id, name, rev, createdAt, updatedAt, submittedAt }) => ({ id, name, rev, createdAt, updatedAt, submittedAt }));
    },
    async countProjects(clientId) {
      return [...projects.values()].filter((p) => p.clientId === clientId).length;
    },
    async createProject(p, now) {
      const row = { id: p.id, clientId: p.clientId, name: p.name, rev: 1, data: clone(p.data), createdAt: now.toISOString(), updatedAt: now.toISOString(), submittedAt: null };
      projects.set(p.id, row);
      return withEmail(row);
    },
    async getProject(id) {
      const p = projects.get(id);
      return p ? withEmail(p) : null;
    },
    async updateProject(id, baseRev, name, data, now) {
      const p = projects.get(id);
      if (!p || p.rev !== baseRev) return null;
      Object.assign(p, { name, data: clone(data), rev: p.rev + 1, updatedAt: now.toISOString() });
      return withEmail(p);
    },
    async deleteProject(id) {
      projects.delete(id);
    },
    async addSubmission(s, now) {
      submissions.push({ ...clone(s), id: submissions.length + 1, at: now });
      const p = projects.get(s.projectId);
      if (p) p.submittedAt = now.toISOString();
      return submissions.length;
    },
    async recentProjects(limit) {
      return [...projects.values()].slice(0, limit).map((p) => ({ ...withEmail(p), submissions: submissions.filter((s) => s.projectId === p.id).length }));
    },
    async counts() {
      return { clients: clients.size, projects: projects.size, submitted: [...projects.values()].filter((p) => p.submittedAt).length };
    },
  };
  return { store, clients, tokens, projects, submissions, hits };
}

export function recordingMailer(fail: (m: Mail) => boolean = () => false) {
  const sent: Mail[] = [];
  const mail: Mailer = async (m) => {
    if (fail(m)) return { ok: false, error: 'boom' };
    sent.push(m);
    return { ok: true, id: `msg-${sent.length}` };
  };
  return { mail, sent };
}

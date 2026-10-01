/* The Blueprint Builder API (/api/builder/*), with every dependency injected
   (see deps.ts for the real wiring; api.test.ts drives it with the
   in-memory store).

   Who can do what:
   - anyone:            request a sign-in link (rate-limited), use a link once
   - a signed-in client: list, create, load, save, delete and submit THEIR
                        projects; delete their account
   - a BPC reviewer:    load and save the ONE project their review session
                        names, and only the BPC parts of it (merge.ts)

   Every state-changing request must come from the public site's own origin
   (checked on the Origin header) and, apart from the sign-in form, carry
   JSON; with SameSite=Lax cookies that closes off cross-site requests. */

import { randomBytes } from 'node:crypto';
import { createLoginToken, hashLoginToken, looksLikeLoginToken, normaliseEmail } from './auth/loginToken';
import {
  clearCookie,
  clientCookie,
  signClientSession,
  verifyClientSession,
  verifyReviewSession,
} from './auth/session';
import { ProjectError, blueprintMarkdown, documentStates, projectHandover, readProject, type BuilderProject } from './engines';
import { signInMail, submissionMailToBpc, submissionMailToClient, type Mailer } from './mail';
import { mergeForRole, type Role } from './merge';
import { BUILDER_PATH, CLIENT_COOKIE, LIMITS, LOGIN_TOKEN_TTL, REVIEW_COOKIE } from './settings';
import type { BuilderStore, Client, ProjectRow } from './store';

export type ApiDeps = {
  store: BuilderStore;
  mail: Mailer;
  secret: string;
  /** Public site origin: links in emails, and an accepted Origin. */
  siteOrigin: string;
  /** Other accepted Origins: the host the request actually arrived on. */
  alsoAllowOrigins?: string[];
  /** Admin host origin, for the review link in BPC's email. */
  cmsOrigin: string;
  secure: boolean;
  from: string;
  notifyTo: string;
  now: () => Date;
  /** Local dev without Resend: the sign-in link is logged, so report success. */
  devLinksInLog?: boolean;
  newProjectId?: () => string;
};

type Actor = { kind: 'client'; client: Client } | { kind: 'bpc'; projectId: string; email: string };

const HEADERS = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' };

function json(status: number, body: unknown, cookies: string[] = []): Response {
  const h = new Headers({ ...HEADERS, 'content-type': 'application/json; charset=utf-8' });
  for (const c of cookies) h.append('set-cookie', c);
  return new Response(JSON.stringify(body), { status, headers: h });
}
const err = (status: number, error: string, extra: Record<string, unknown> = {}) => json(status, { error, ...extra });

function redirect(to: string, cookies: string[] = []): Response {
  const h = new Headers({ ...HEADERS, location: to });
  for (const c of cookies) h.append('set-cookie', c);
  return new Response(null, { status: 303, headers: h });
}

function cookieValue(req: Request, name: string): string | null {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq > -1 && part.slice(0, eq).trim() === name) {
      const v = part.slice(eq + 1).trim();
      if (v) return v;
    }
  }
  return null;
}

function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newProjectId(): string {
  const bytes = randomBytes(10);
  return 'BP-' + Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('');
}
const PROJECT_ID = /^BP-[A-Z2-9]{10}$/;

async function readBody(req: Request, max: number): Promise<{ ok: true; text: string } | { ok: false; res: Response }> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > max) return { ok: false, res: err(413, 'That is too large to save.') };
  const text = await req.text();
  if (Buffer.byteLength(text, 'utf8') > max) return { ok: false, res: err(413, 'That is too large to save.') };
  return { ok: true, text };
}

async function readJson(req: Request, max: number): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; res: Response }> {
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return { ok: false, res: err(415, 'Send JSON.') };
  const r = await readBody(req, max);
  if (!r.ok) return r;
  try {
    const body = JSON.parse(r.text || '{}');
    if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, res: err(400, 'Send a JSON object.') };
    return { ok: true, body };
  } catch {
    return { ok: false, res: err(400, 'That is not valid JSON.') };
  }
}

async function currentClient(req: Request, d: ApiDeps): Promise<Client | null> {
  const s = await verifyClientSession(cookieValue(req, CLIENT_COOKIE), d.secret);
  if (!s) return null;
  // The account must still exist (deleted accounts end every session).
  const c = await d.store.getClient(s.clientId);
  return c && c.email === s.email ? c : null;
}

async function currentReviewer(req: Request, d: ApiDeps) {
  return verifyReviewSession(cookieValue(req, REVIEW_COOKIE), d.secret);
}

/** Load a project and decide the caller's role on it; null means "not found"
 *  for this caller (never reveal that someone else's project exists). */
async function projectFor(req: Request, d: ApiDeps, id: string): Promise<{ row: ProjectRow; actor: Actor; role: Role } | null> {
  if (!PROJECT_ID.test(id)) return null;
  const reviewer = await currentReviewer(req, d);
  if (reviewer && reviewer.projectId === id) {
    const row = await d.store.getProject(id);
    return row ? { row, actor: { kind: 'bpc', ...reviewer }, role: 'bpc' } : null;
  }
  const client = await currentClient(req, d);
  if (!client) return null;
  const row = await d.store.getProject(id);
  if (!row || row.clientId !== client.id) return null;
  return { row, actor: { kind: 'client', client }, role: 'client' };
}

const projectOut = (r: ProjectRow, role: Role) => ({
  id: r.id,
  rev: r.rev,
  role,
  project: r.data,
  updatedAt: r.updatedAt,
  submittedAt: r.submittedAt,
  // A reviewer sees whose project it is; a client already knows.
  ...(role === 'bpc' ? { clientEmail: r.clientEmail } : {}),
});

export async function handleBuilderApi(req: Request, path: string[], d: ApiDeps): Promise<Response> {
  const method = req.method.toUpperCase();
  const origin = req.headers.get('origin');
  if (method !== 'GET' && method !== 'HEAD' && (!origin || (origin !== d.siteOrigin && !d.alsoAllowOrigins?.includes(origin)))) {
    return err(403, 'This request must come from Blueprint Builder.');
  }
  const [a, b, c, extra] = path;
  if (extra !== undefined) return err(404, 'Not found.');

  if (a === 'auth' && c === undefined) {
    if (method !== 'POST') return err(405, 'Method not allowed.');
    if (b === 'request') return requestLink(req, d);
    if (b === 'verify') return verifyLink(req, d);
    if (b === 'sign-out') return json(200, { ok: true }, [clearCookie(CLIENT_COOKIE, d.secure)]);
    if (b === 'end-review') return json(200, { ok: true }, [clearCookie(REVIEW_COOKIE, d.secure)]);
    return err(404, 'Not found.');
  }

  if (a === 'me' && b === undefined) {
    if (method !== 'GET') return err(405, 'Method not allowed.');
    const [reviewer, client] = await Promise.all([currentReviewer(req, d), currentClient(req, d)]);
    return json(200, {
      client: client ? { email: client.email } : null,
      review: reviewer ? { email: reviewer.email, projectId: reviewer.projectId } : null,
    });
  }

  if (a === 'account' && b === undefined) {
    if (method !== 'DELETE') return err(405, 'Method not allowed.');
    const client = await currentClient(req, d);
    if (!client) return err(401, 'Sign in first.');
    await d.store.deleteClient(client.id);
    return json(200, { ok: true }, [clearCookie(CLIENT_COOKIE, d.secure)]);
  }

  if (a === 'projects' && b === undefined) {
    const client = await currentClient(req, d);
    if (!client) return err(401, 'Sign in first.');
    if (method === 'GET') return json(200, { projects: await d.store.listProjects(client.id) });
    if (method === 'POST') return createProject(req, d, client);
    return err(405, 'Method not allowed.');
  }

  if (a === 'projects' && b !== undefined) {
    const found = await projectFor(req, d, b);
    if (!found) return err(404, 'Project not found.');
    if (c === undefined) {
      if (method === 'GET') return json(200, projectOut(found.row, found.role));
      if (method === 'PUT') return saveProject(req, d, found.row, found.role);
      if (method === 'DELETE') {
        if (found.role !== 'client') return err(403, 'Only the client can delete a project.');
        await d.store.deleteProject(found.row.id);
        return json(200, { ok: true });
      }
      return err(405, 'Method not allowed.');
    }
    if (c === 'submit') {
      if (method !== 'POST') return err(405, 'Method not allowed.');
      if (found.actor.kind !== 'client') return err(403, 'Only the client can send a blueprint.');
      return submitProject(req, d, found.row, found.actor.client);
    }
  }

  return err(404, 'Not found.');
}

async function requestLink(req: Request, d: ApiDeps): Promise<Response> {
  const r = await readJson(req, LIMITS.smallBodyBytes);
  if (!r.ok) return r.res;
  const email = normaliseEmail(r.body.email);
  if (!email) return err(400, 'Enter a valid email address.');
  const [byEmail, byIp] = await Promise.all([d.store.hit(`login:email:${hashLoginToken(email)}`, 3600), d.store.hit(`login:ip:${clientIp(req)}`, 3600)]);
  if (byEmail > LIMITS.loginPerEmail || byIp > LIMITS.loginPerIp) {
    return err(429, 'Too many sign-in emails. Wait an hour and try again, or email hello@blueprintcode.ai.');
  }
  const { token, hash } = createLoginToken();
  await d.store.saveLoginToken(hash, email, new Date(d.now().getTime() + LOGIN_TOKEN_TTL * 1000));
  const link = `${d.siteOrigin}${BUILDER_PATH}/sign-in?token=${token}`;
  const sent = await d.mail(signInMail({ from: d.from, to: email, link, minutes: LOGIN_TOKEN_TTL / 60 }));
  if (!sent.ok && !d.devLinksInLog) return err(502, "We couldn't send the email. Try again, or email hello@blueprintcode.ai.");
  // Same answer for every address: nothing here says whether an account exists.
  return json(200, { ok: true });
}

async function verifyLink(req: Request, d: ApiDeps): Promise<Response> {
  const failed = redirect(`${d.siteOrigin}${BUILDER_PATH}/sign-in?error=expired`);
  const r = await readBody(req, LIMITS.smallBodyBytes);
  if (!r.ok) return failed;
  const token = new URLSearchParams(r.text).get('token');
  if (!looksLikeLoginToken(token)) return failed;
  const now = d.now();
  const email = await d.store.consumeLoginToken(hashLoginToken(token), now);
  if (!email) return failed;
  const client = await d.store.upsertClient(email, now);
  const session = await signClientSession({ clientId: client.id, email: client.email }, d.secret, Math.floor(now.getTime() / 1000));
  return redirect(`${d.siteOrigin}${BUILDER_PATH}#/projects`, [clientCookie(session, d.secure)]);
}

function parseProject(raw: unknown): { ok: true; p: BuilderProject } | { ok: false; res: Response } {
  try {
    return { ok: true, p: readProject(raw) };
  } catch (e) {
    return { ok: false, res: err(422, e instanceof ProjectError ? e.message : 'The project could not be read.') };
  }
}

async function createProject(req: Request, d: ApiDeps, client: Client): Promise<Response> {
  const r = await readJson(req, LIMITS.projectBytes);
  if (!r.ok) return r.res;
  const parsed = parseProject(r.body.project);
  if (!parsed.ok) return parsed.res;
  if ((await d.store.countProjects(client.id)) >= LIMITS.projectsPerClient) {
    return err(409, `You can keep up to ${LIMITS.projectsPerClient} projects. Delete one first.`);
  }
  if ((await d.store.hit(`create:${client.id}`, 86400)) > LIMITS.projectCreatesPerDay) return err(429, 'Too many new projects today.');
  const id = (d.newProjectId ?? newProjectId)();
  const data = { ...mergeForRole(null, parsed.p, 'client'), id };
  const row = await d.store.createProject({ id, clientId: client.id, name: String(data.name ?? '').slice(0, 200), data }, d.now());
  return json(201, projectOut(row, 'client'));
}

async function saveProject(req: Request, d: ApiDeps, row: ProjectRow, role: Role): Promise<Response> {
  const r = await readJson(req, LIMITS.projectBytes);
  if (!r.ok) return r.res;
  const baseRev = Number(r.body.rev);
  if (!Number.isInteger(baseRev)) return err(400, 'Missing rev.');
  if (baseRev !== row.rev) return err(409, 'This project changed somewhere else.', { rev: row.rev });
  const parsed = parseProject(r.body.project);
  if (!parsed.ok) return parsed.res;
  const merged = { ...mergeForRole(row.data, parsed.p, role), id: row.id };
  const name = role === 'client' ? String(merged.name ?? '').slice(0, 200) : row.name;
  const saved = await d.store.updateProject(row.id, baseRev, name, merged, d.now());
  if (!saved) {
    const latest = await d.store.getProject(row.id);
    return err(409, 'This project changed somewhere else.', { rev: latest?.rev ?? row.rev });
  }
  return json(200, projectOut(saved, role));
}

async function submitProject(req: Request, d: ApiDeps, row: ProjectRow, client: Client): Promise<Response> {
  const r = await readJson(req, LIMITS.smallBodyBytes);
  if (!r.ok) return r.res;
  if (Number(r.body.rev) !== row.rev) return err(409, 'Save your latest changes before sending.', { rev: row.rev });
  if ((await d.store.hit(`submit:${row.id}`, 3600)) > LIMITS.submitPerProject) {
    return err(429, 'This blueprint has been sent several times in the last hour. Try again later.');
  }
  const p = row.data;
  const now = d.now();
  let markdown: string, handover: Record<string, unknown>, documents: { total: number; byState: Record<string, number> };
  try {
    markdown = blueprintMarkdown(p, now);
    handover = projectHandover(p);
    documents = documentStates(p);
  } catch {
    return err(422, 'The blueprint could not be generated from this project.');
  }
  const version = Number(p.version) || 1;
  const tools = (p.tools as { id?: unknown; name?: unknown }[]).map((t) => ({ id: String(t.id ?? ''), name: String(t.name ?? '') }));
  const facts = {
    projectId: row.id,
    projectName: row.name,
    description: String(p.description ?? ''),
    clientEmail: client.email,
    version,
    tools,
    documents,
    markdown,
    handover,
    reviewUrl: `${d.cmsOrigin}/api/cms/builder-review/${row.id}`,
  };
  const toBpc = await d.mail(submissionMailToBpc({ from: d.from, to: d.notifyTo, ...facts }));
  const toClient = await d.mail(
    submissionMailToClient({ from: d.from, to: client.email, replyTo: d.notifyTo, projectUrl: `${d.siteOrigin}${BUILDER_PATH}`, projectName: row.name, version, markdown }),
  );
  await d.store.addSubmission(
    {
      projectId: row.id,
      rev: row.rev,
      projectName: row.name,
      clientEmail: client.email,
      data: p,
      handover,
      markdown,
      emailStatus: toBpc.ok ? 'sent' : `error: ${toBpc.error}`,
      emailIds: [toBpc, toClient].flatMap((m) => (m.ok ? [m.id] : [])),
    },
    now,
  );
  return json(200, { ok: true, submittedAt: now.toISOString(), sent: toBpc.ok, copySent: toClient.ok });
}

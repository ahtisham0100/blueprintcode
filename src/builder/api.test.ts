import { describe, expect, it } from 'vitest';
import { handleBuilderApi, type ApiDeps } from './api';
import { signClientSession, signReviewSession } from './auth/session';
import { CTX, Documents, demoProject, type BuilderProject } from './engines';
import { memoryStore, recordingMailer } from './testing';

const SITE = 'https://blueprintcode.ai';
const SECRET = 's'.repeat(40);
const NOW = new Date('2026-09-30T10:00:00.000Z');

function setup(opts: { failMail?: boolean } = {}) {
  const mem = memoryStore();
  const mailer = recordingMailer(() => !!opts.failMail);
  let ids = 0;
  const deps: ApiDeps = {
    store: mem.store,
    mail: mailer.mail,
    secret: SECRET,
    siteOrigin: SITE,
    cmsOrigin: 'https://admin.blueprintcode.ai',
    secure: true,
    from: 'BPC <hello@blueprintcode.ai>',
    notifyTo: 'hello@blueprintcode.ai',
    now: () => NOW,
    newProjectId: () => `BP-${String(++ids).padStart(10, 'A').replace(/[01]/g, 'Z')}`,
  };
  const call = (method: string, path: string, o: { body?: unknown; cookie?: string; origin?: string | null; type?: string; raw?: string } = {}) => {
    const headers: Record<string, string> = {};
    if (o.origin !== null && method !== 'GET') headers.origin = o.origin ?? SITE;
    if (o.cookie) headers.cookie = o.cookie;
    if (o.body !== undefined || o.raw !== undefined) headers['content-type'] = o.type ?? 'application/json';
    const req = new Request(`${SITE}/api/builder/${path}`, {
      method,
      headers,
      body: o.raw ?? (o.body === undefined ? undefined : JSON.stringify(o.body)),
    });
    return handleBuilderApi(req, path.split('/').filter(Boolean), deps);
  };
  return { mem, mailer, deps, call };
}

/** Request a link, pull the token out of the email, POST it like the sign-in page does. */
async function signIn(t: ReturnType<typeof setup>, email = 'client@example.com'): Promise<string> {
  expect((await t.call('POST', 'auth/request', { body: { email } })).status).toBe(200);
  const link = t.mailer.sent.at(-1)!.text.match(/https:\/\/\S+/)![0];
  const token = new URL(link).searchParams.get('token')!;
  const res = await t.call('POST', 'auth/verify', { raw: `token=${token}`, type: 'application/x-www-form-urlencoded' });
  expect(res.status).toBe(303);
  const cookie = res.headers.get('set-cookie')!;
  return cookie.split(';')[0];
}

async function createDemo(t: ReturnType<typeof setup>, cookie: string): Promise<{ id: string; rev: number; project: BuilderProject }> {
  const res = await t.call('POST', 'projects', { cookie, body: { project: demoProject(NOW.toISOString()) } });
  expect(res.status).toBe(201);
  return res.json();
}

describe('sign-in by email link', () => {
  it('emails a single-use link, then sets a host-only client cookie', async () => {
    const t = setup();
    const res = await t.call('POST', 'auth/request', { body: { email: ' Client@Example.com ' } });
    expect(res.status).toBe(200);
    const m = t.mailer.sent[0];
    expect(m.to).toBe('client@example.com');
    const link = new URL(m.text.match(/https:\/\/\S+/)![0]);
    expect(link.origin + link.pathname).toBe(`${SITE}/builder/sign-in`);
    // Only the hash is stored.
    const token = link.searchParams.get('token')!;
    expect([...t.mem.tokens.keys()][0]).not.toBe(token);

    const verify = () => t.call('POST', 'auth/verify', { raw: `token=${token}`, type: 'application/x-www-form-urlencoded' });
    const ok = await verify();
    expect(ok.status).toBe(303);
    expect(ok.headers.get('location')).toBe(`${SITE}/builder#/projects`);
    expect(ok.headers.get('set-cookie')).toMatch(/^bpcb-client=.+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=\d+; Secure$/);

    const again = await verify();
    expect(again.headers.get('location')).toBe(`${SITE}/builder/sign-in?error=expired`);
    expect(again.headers.get('set-cookie')).toBeNull();
  });

  it('refuses expired links', async () => {
    const t = setup();
    await t.call('POST', 'auth/request', { body: { email: 'a@example.com' } });
    const token = new URL(t.mailer.sent[0].text.match(/https:\/\/\S+/)![0]).searchParams.get('token')!;
    t.deps.now = () => new Date(NOW.getTime() + 16 * 60 * 1000);
    const res = await t.call('POST', 'auth/verify', { raw: `token=${token}`, type: 'application/x-www-form-urlencoded' });
    expect(res.headers.get('location')).toContain('error=expired');
  });

  it('gives the same answer for any address and never says whether an account exists', async () => {
    const t = setup();
    await signIn(t, 'known@example.com');
    const known = await (await t.call('POST', 'auth/request', { body: { email: 'known@example.com' } })).json();
    const unknown = await (await t.call('POST', 'auth/request', { body: { email: 'new@example.com' } })).json();
    expect(known).toEqual(unknown);
  });

  it('rate-limits by address and by IP', async () => {
    const t = setup();
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await t.call('POST', 'auth/request', { body: { email: 'a@example.com' } })).status);
    expect(codes).toEqual([200, 200, 200, 200, 200, 429]);
    expect(t.mailer.sent).toHaveLength(5);
  });

  it('rejects a bad address, and reports when the email could not be sent', async () => {
    expect((await setup().call('POST', 'auth/request', { body: { email: 'nope' } })).status).toBe(400);
    expect((await setup({ failMail: true }).call('POST', 'auth/request', { body: { email: 'a@example.com' } })).status).toBe(502);
  });

  it('blocks cross-site and non-JSON requests', async () => {
    const t = setup();
    expect((await t.call('POST', 'auth/request', { body: { email: 'a@example.com' }, origin: 'https://evil.example' })).status).toBe(403);
    expect((await t.call('POST', 'auth/request', { body: { email: 'a@example.com' }, origin: null })).status).toBe(403);
    expect((await t.call('POST', 'auth/request', { raw: 'email=a@example.com', type: 'application/x-www-form-urlencoded' })).status).toBe(415);
    expect(t.mailer.sent).toHaveLength(0);
  });

  it('signs out by clearing the cookie', async () => {
    const res = await setup().call('POST', 'auth/sign-out', { body: {} });
    expect(res.headers.get('set-cookie')).toMatch(/^bpcb-client=; .*Max-Age=0/);
  });
});

describe('projects', () => {
  it('needs a signed-in client', async () => {
    const t = setup();
    expect((await t.call('GET', 'projects')).status).toBe(401);
    expect((await t.call('GET', 'me')).status).toBe(200);
    expect(await (await t.call('GET', 'me')).json()).toEqual({ client: null, review: null });
  });

  it('creates, lists, loads and saves with a revision check', async () => {
    const t = setup();
    const cookie = await signIn(t);
    expect(await (await t.call('GET', 'me', { cookie })).json()).toEqual({ client: { email: 'client@example.com' }, review: null });
    const created = await createDemo(t, cookie);
    expect(created.project.id).toBe(created.id);
    expect(created.rev).toBe(1);
    expect((await (await t.call('GET', 'projects', { cookie })).json()).projects).toHaveLength(1);

    const p = { ...created.project, name: 'Renamed' };
    const saved = await t.call('PUT', `projects/${created.id}`, { cookie, body: { rev: 1, project: p } });
    expect(saved.status).toBe(200);
    expect((await saved.json()).rev).toBe(2);

    const stale = await t.call('PUT', `projects/${created.id}`, { cookie, body: { rev: 1, project: p } });
    expect(stale.status).toBe(409);
    expect((await stale.json()).rev).toBe(2);
  });

  it('hides other clients’ projects completely', async () => {
    const t = setup();
    const alice = await signIn(t, 'alice@example.com');
    const bob = await signIn(t, 'bob@example.com');
    const { id, project } = await createDemo(t, alice);
    expect((await t.call('GET', `projects/${id}`, { cookie: bob })).status).toBe(404);
    expect((await t.call('PUT', `projects/${id}`, { cookie: bob, body: { rev: 1, project } })).status).toBe(404);
    expect((await t.call('DELETE', `projects/${id}`, { cookie: bob })).status).toBe(404);
    expect((await t.call('POST', `projects/${id}/submit`, { cookie: bob, body: { rev: 1 } })).status).toBe(404);
    expect((await (await t.call('GET', 'projects', { cookie: bob })).json()).projects).toEqual([]);
  });

  it('rejects forged or tampered sessions', async () => {
    const t = setup();
    const alice = await signIn(t, 'alice@example.com');
    const { id } = await createDemo(t, alice);
    const forged = await signClientSession({ clientId: [...t.mem.clients.keys()][0], email: 'alice@example.com' }, 'w'.repeat(40));
    expect((await t.call('GET', `projects/${id}`, { cookie: `bpcb-client=${forged}` })).status).toBe(404);
    expect((await t.call('GET', 'projects', { cookie: alice + 'x' })).status).toBe(401);
  });

  it('refuses invalid projects and oversized bodies', async () => {
    const t = setup();
    const cookie = await signIn(t);
    const bad = await t.call('POST', 'projects', { cookie, body: { project: { schema: 'nope', tools: [] } } });
    expect(bad.status).toBe(422);
    expect((await bad.json()).error).toMatch(/Blueprint Builder project/);
    const big = await t.call('POST', 'projects', { cookie, raw: JSON.stringify({ project: { pad: 'x'.repeat(2_600_000) } }) });
    expect(big.status).toBe(413);
  });

  it('strips BPC approvals a client tries to send', async () => {
    const t = setup();
    const cookie = await signIn(t);
    const p = demoProject(NOW.toISOString());
    p.reviews = { 'P-TECH': { bpc: { at: NOW.toISOString(), hash: 'x' } } };
    p.comments = { 'REQ-1': [{ at: NOW.toISOString(), by: 'bpc', text: 'fake' }] };
    const res = await t.call('POST', 'projects', { cookie, body: { project: p } });
    const body = await res.json();
    expect(body.project.reviews).toEqual({});
    expect(body.project.comments).toEqual({});
  });

  it('deletes a project, and deleting the account removes everything and ends the session', async () => {
    const t = setup();
    const cookie = await signIn(t);
    const a = await createDemo(t, cookie);
    await createDemo(t, cookie);
    expect((await t.call('DELETE', `projects/${a.id}`, { cookie })).status).toBe(200);
    expect(t.mem.projects.size).toBe(1);
    const del = await t.call('DELETE', 'account', { cookie });
    expect(del.status).toBe(200);
    expect(del.headers.get('set-cookie')).toMatch(/Max-Age=0/);
    expect(t.mem.projects.size).toBe(0);
    expect(t.mem.clients.size).toBe(0);
    expect((await t.call('GET', 'projects', { cookie })).status).toBe(401);
  });
});

describe('sending a blueprint', () => {
  it('generates the blueprint on the server and emails BPC and the client', async () => {
    const t = setup();
    const cookie = await signIn(t);
    const { id } = await createDemo(t, cookie);
    t.mailer.sent.length = 0;
    const res = await t.call('POST', `projects/${id}/submit`, { cookie, body: { rev: 1 } });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, sent: true, copySent: true });

    const [bpc, client] = t.mailer.sent;
    expect(bpc.to).toBe('hello@blueprintcode.ai');
    expect(bpc.replyTo).toBe('client@example.com');
    expect(bpc.subject).toContain(id);
    expect(bpc.attachments!.map((a) => a.filename)).toEqual([expect.stringMatching(/blueprint\.md$/), expect.stringMatching(/handover\.json$/)]);
    const handover = JSON.parse(Buffer.from(bpc.attachments![1].content, 'base64').toString('utf8'));
    expect(handover.schema).toBe('bpc.handover/1');
    expect(handover.project.id).toBe(id);
    expect(bpc.html).toContain(`https://admin.blueprintcode.ai/api/cms/builder-review/${id}`);

    expect(client.to).toBe('client@example.com');
    expect(client.attachments!.map((a) => a.filename)).toEqual([expect.stringMatching(/blueprint\.md$/)]);

    expect(t.mem.submissions).toHaveLength(1);
    expect(t.mem.submissions[0]).toMatchObject({ projectId: id, emailStatus: 'sent', emailIds: ['msg-1', 'msg-2'] });
    expect(t.mem.projects.get(id)!.submittedAt).toBe(NOW.toISOString());
  });

  it('keeps the submission but reports sent: false when email fails', async () => {
    const t = setup();
    const cookie = await signIn(t);
    const { id } = await createDemo(t, cookie);
    t.deps.mail = async () => ({ ok: false, error: 'resend down' });
    const body = await (await t.call('POST', `projects/${id}/submit`, { cookie, body: { rev: 1 } })).json();
    expect(body).toMatchObject({ ok: true, sent: false, copySent: false });
    expect(t.mem.submissions[0].emailStatus).toBe('error: resend down');
  });

  it('only sends the saved version', async () => {
    const t = setup();
    const cookie = await signIn(t);
    const { id } = await createDemo(t, cookie);
    expect((await t.call('POST', `projects/${id}/submit`, { cookie, body: { rev: 7 } })).status).toBe(409);
  });
});

describe('BPC review sessions', () => {
  async function withReview(t: ReturnType<typeof setup>) {
    const cookie = await signIn(t);
    const created = await createDemo(t, cookie);
    // The client approves P-TECH.
    const p = created.project;
    const d = Documents.documentSet(p, CTX).find((x) => x.id === 'P-TECH')!;
    Documents.approve(p, d, 'client', NOW.toISOString());
    const saved = await (await t.call('PUT', `projects/${created.id}`, { cookie, body: { rev: 1, project: p } })).json();
    const review = `bpcb-review=${await signReviewSession({ projectId: created.id, email: 'james@blueprintcode.ai' }, SECRET)}`;
    return { clientCookie: cookie, review, id: created.id, saved };
  }

  it('can load and approve its one project, but not change the client’s answers', async () => {
    const t = setup();
    const { review, id, saved } = await withReview(t);
    expect(await (await t.call('GET', 'me', { cookie: review })).json()).toEqual({ client: null, review: { email: 'james@blueprintcode.ai', projectId: id } });
    const loaded = await (await t.call('GET', `projects/${id}`, { cookie: review })).json();
    expect(loaded.role).toBe('bpc');
    const p = loaded.project;
    const d = Documents.documentSet(p, CTX).find((x) => x.id === 'P-TECH')!;
    Documents.approve(p, d, 'bpc', NOW.toISOString());
    p.name = 'Changed by reviewer';
    const res = await t.call('PUT', `projects/${id}`, { cookie: review, body: { rev: saved.rev, project: p } });
    expect(res.status).toBe(200);
    const out = (await res.json()).project;
    expect(out.name).toBe(saved.project.name);
    expect(out.reviews['P-TECH'].bpc).toBeTruthy();
    expect(Documents.documentSet(out, CTX).find((x) => x.id === 'P-TECH')!.state).toBe('bpc_approved');
  });

  it('cannot reach other projects, list, delete, submit or act as the client', async () => {
    const t = setup();
    const { review, id, saved } = await withReview(t);
    const other = await createDemo(t, await signIn(t, 'other@example.com'));
    expect((await t.call('GET', `projects/${other.id}`, { cookie: review })).status).toBe(404);
    expect((await t.call('GET', 'projects', { cookie: review })).status).toBe(401);
    expect((await t.call('DELETE', `projects/${id}`, { cookie: review })).status).toBe(403);
    expect((await t.call('POST', `projects/${id}/submit`, { cookie: review, body: { rev: saved.rev } })).status).toBe(403);
  });

  it('a client cookie is not a review session, and a review cookie is not a client session', async () => {
    const t = setup();
    const { clientCookie, id } = await withReview(t);
    const asReview = clientCookie.replace('bpcb-client=', 'bpcb-review=');
    expect((await t.call('GET', `projects/${id}`, { cookie: asReview })).status).toBe(404);
  });

  it('ending a review clears only the review cookie', async () => {
    const res = await setup().call('POST', 'auth/end-review', { body: {} });
    expect(res.headers.get('set-cookie')).toMatch(/^bpcb-review=; .*Max-Age=0/);
  });
});

describe('routing', () => {
  it('404s unknown paths and 405s wrong methods', async () => {
    const t = setup();
    expect((await t.call('GET', 'nope')).status).toBe(404);
    expect((await t.call('GET', 'auth/request')).status).toBe(405);
    expect((await t.call('GET', 'projects/BP-AAAAAAAAAA/submit/x')).status).toBe(404);
    expect((await t.call('GET', 'projects/../../etc')).status).toBe(404);
    expect((await t.call('GET', 'projects/not-an-id')).status).toBe(404);
  });
});

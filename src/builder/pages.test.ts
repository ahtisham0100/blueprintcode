import { describe, expect, it } from 'vitest';
import { signReviewLink, signReviewSession, verifyReviewSession } from './auth/session';
import { APP_CSP, handleBuilderPage, type PageDeps } from './pages';

const SECRET = 'p'.repeat(40);
const SITE = 'https://blueprintcode.ai';
const deps = (html: string | null = '<!doctype html><title>app</title>'): PageDeps => ({ secret: SECRET, secure: true, siteOrigin: SITE, appHtml: () => html });
const get = (path: string, d = deps()) => {
  const url = new URL(`${SITE}/builder${path}`);
  return handleBuilderPage(new Request(url), url.pathname.split('/').filter(Boolean).slice(1), d);
};
const TOKEN = 'A'.repeat(43);

describe('builder pages', () => {
  it('serves the app with a policy that only lets it talk to this site', async () => {
    const res = await get('');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<title>app</title>');
    expect(res.headers.get('content-security-policy')).toBe(APP_CSP);
    expect(APP_CSP).toContain("connect-src 'self'");
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('says so when the app has not been built', async () => {
    expect((await get('', deps(null))).status).toBe(503);
  });

  it('shows a button that posts the sign-in token, rather than using it on GET', async () => {
    const res = await get(`/sign-in?token=${TOKEN}`);
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(body).toContain('<form method="post" action="/api/builder/auth/verify">');
    expect(body).toContain(`name="token" value="${TOKEN}"`);
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('explains an expired or malformed link, without echoing it', async () => {
    for (const q of ['?error=expired', '?token=%22%3E%3Cscript%3E', '']) {
      const res = await get(`/sign-in${q}`);
      expect(res.status).toBe(400);
      expect(await res.text()).not.toContain('<script>');
    }
  });

  it('turns a valid review link into a review session and opens the blueprint', async () => {
    const link = await signReviewLink({ projectId: 'BP-AAAAAAAAAA', email: 'james@blueprintcode.ai' }, SECRET);
    const res = await get(`/review?token=${link}`);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(`${SITE}/builder#/blueprint`);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toMatch(/^bpcb-review=.+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=14400; Secure$/);
    const session = await verifyReviewSession(cookie.split(';')[0].split('=')[1], SECRET);
    expect(session).toEqual({ projectId: 'BP-AAAAAAAAAA', email: 'james@blueprintcode.ai' });
  });

  it('refuses a review session token used as a link, and expired links', async () => {
    const session = await signReviewSession({ projectId: 'BP-AAAAAAAAAA', email: 'j@blueprintcode.ai' }, SECRET);
    expect((await get(`/review?token=${session}`)).status).toBe(403);
    const old = await signReviewLink({ projectId: 'BP-AAAAAAAAAA', email: 'j@blueprintcode.ai' }, SECRET, Math.floor(Date.now() / 1000) - 600);
    expect((await get(`/review?token=${old}`)).status).toBe(403);
  });

  it('404s anything else', async () => {
    expect((await get('/admin')).status).toBe(404);
    expect((await get('/sign-in/extra')).status).toBe(404);
  });
});

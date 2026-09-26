import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { handleGoogleCallback, handleGoogleStart, type OAuthDeps } from './handlers';
import { SESSION_COOKIE, verifySession } from './session';

const SECRET = 'test-secret-that-is-long-enough-for-hs256-0123456789';
const user = { id: 'u1', email: 'a@blueprintcode.ai', role: 'admin' as const, active: true };

function deps(over: Partial<OAuthDeps> = {}): OAuthDeps {
  return {
    clientId: 'cid',
    clientSecret: 'sec',
    serverUrl: 'https://admin.blueprintcode.ai',
    allowedDomain: 'blueprintcode.ai',
    secret: SECRET,
    secure: true,
    exchangeCode: vi.fn(async () => 'idt'),
    verifyIdToken: vi.fn(async () => ({ sub: '9', email: user.email, emailVerified: true, hd: 'blueprintcode.ai', name: 'A' })),
    findUserByEmail: vi.fn(async (e: string) => (e === user.email ? user : null)),
    ...over,
  };
}

function cookiesOf(res: Response): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(';');
    const [k, v] = pair.split('=');
    out[k] = v;
  }
  return out;
}

describe('handleGoogleStart', () => {
  it('redirects to Google and pins state + nonce in short-lived HttpOnly cookies', () => {
    const res = handleGoogleStart(deps());
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get('location')!);
    expect(loc.hostname).toBe('accounts.google.com');
    expect(loc.searchParams.get('redirect_uri')).toBe('https://admin.blueprintcode.ai/api/cms/oauth/google/callback');
    const cookies = cookiesOf(res);
    expect(cookies['bpc-oauth-state']).toBe(loc.searchParams.get('state'));
    expect(cookies['bpc-oauth-nonce']).toBe(loc.searchParams.get('nonce'));
    for (const c of res.headers.getSetCookie()) {
      expect(c).toMatch(/HttpOnly/);
      expect(c).toMatch(/SameSite=Lax/);
      expect(c).toMatch(/Max-Age=600/);
    }
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('generates a fresh unguessable state each time', () => {
    const a = cookiesOf(handleGoogleStart(deps()))['bpc-oauth-state'];
    const b = cookiesOf(handleGoogleStart(deps()))['bpc-oauth-state'];
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });
});

function callbackReq(query: Record<string, string>, cookies: Record<string, string>) {
  const url = new URL('https://admin.blueprintcode.ai/api/cms/oauth/google/callback');
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const cookie = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return new NextRequest(url, { headers: { cookie } });
}

describe('handleGoogleCallback', () => {
  const good = { code: 'c', state: 'S' };
  const jar = { 'bpc-oauth-state': 'S', 'bpc-oauth-nonce': 'N' };

  it('signs the user in: session cookie set, temp cookies cleared, redirect to /cms', async () => {
    const d = deps();
    const res = await handleGoogleCallback(callbackReq(good, jar), d);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://admin.blueprintcode.ai/cms');
    const cookies = cookiesOf(res);
    const session = await verifySession(cookies[SESSION_COOKIE], SECRET);
    expect(session).toEqual({ userId: 'u1', email: user.email });
    expect(cookies['bpc-oauth-state']).toBe('');
    expect(cookies['bpc-oauth-nonce']).toBe('');
    expect(d.exchangeCode).toHaveBeenCalledWith(expect.objectContaining({ code: 'c' }));
    expect(d.verifyIdToken).toHaveBeenCalledWith('idt', expect.objectContaining({ nonce: 'N' }));
  });

  it('rejects a missing or mismatched state (CSRF) before talking to Google', async () => {
    const d = deps();
    const r1 = await handleGoogleCallback(callbackReq(good, { ...jar, 'bpc-oauth-state': 'other' }), d);
    const r2 = await handleGoogleCallback(callbackReq(good, {}), d);
    const r3 = await handleGoogleCallback(callbackReq({ code: 'c' }, jar), d);
    for (const r of [r1, r2, r3]) expect(r.status).toBe(400);
    expect(d.exchangeCode).not.toHaveBeenCalled();
  });

  it('shows an access-denied page (403) for an outsider, with no session cookie', async () => {
    const d = deps({
      verifyIdToken: vi.fn(async () => ({ sub: '1', email: 'x@gmail.com', emailVerified: true, hd: undefined, name: 'X' })),
    });
    const res = await handleGoogleCallback(callbackReq(good, jar), d);
    expect(res.status).toBe(403);
    expect(cookiesOf(res)[SESSION_COOKIE]).toBeUndefined();
    expect(await res.text()).toMatch(/wrong_domain/);
  });

  it('shows access denied for an in-domain account that is not allowlisted', async () => {
    const d = deps({ findUserByEmail: vi.fn(async () => null) });
    const res = await handleGoogleCallback(callbackReq(good, jar), d);
    expect(res.status).toBe(403);
    expect(await res.text()).toMatch(/not_allowlisted/);
  });

  it('surfaces a Google error (user cancelled) as 400 without exchanging', async () => {
    const d = deps();
    const res = await handleGoogleCallback(callbackReq({ error: 'access_denied', state: 'S' }, jar), d);
    expect(res.status).toBe(400);
    expect(d.exchangeCode).not.toHaveBeenCalled();
  });

  it('turns a bad id_token into 401, not a crash', async () => {
    const d = deps({
      verifyIdToken: vi.fn(async () => {
        throw new Error('signature verification failed');
      }),
    });
    const res = await handleGoogleCallback(callbackReq(good, jar), d);
    expect(res.status).toBe(401);
  });
});

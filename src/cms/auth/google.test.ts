import { describe, expect, it, vi } from 'vitest';
import { buildGoogleAuthUrl, exchangeCodeForIdToken, verifyGoogleIdToken } from './google';

describe('buildGoogleAuthUrl', () => {
  const url = new URL(
    buildGoogleAuthUrl({
      clientId: 'cid',
      redirectUri: 'https://admin.blueprintcode.ai/api/cms/oauth/google/callback',
      state: 'st',
      nonce: 'nc',
      hostedDomain: 'blueprintcode.ai',
    }),
  );

  it('points at Google with an authorization-code request', () => {
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('cid');
    expect(url.searchParams.get('redirect_uri')).toBe('https://admin.blueprintcode.ai/api/cms/oauth/google/callback');
  });

  it('asks only for identity, binds state and nonce, and hints the Workspace domain', () => {
    expect(url.searchParams.get('scope')!.split(' ').sort()).toEqual(['email', 'openid', 'profile']);
    expect(url.searchParams.get('state')).toBe('st');
    expect(url.searchParams.get('nonce')).toBe('nc');
    expect(url.searchParams.get('hd')).toBe('blueprintcode.ai');
    expect(url.searchParams.get('prompt')).toBe('select_account');
    expect(url.searchParams.get('access_type')).toBeNull(); // no refresh tokens wanted
  });
});

describe('exchangeCodeForIdToken', () => {
  it('posts the code to the token endpoint and returns the id_token', async () => {
    const fetchFn = vi.fn(async (_url: string, init: RequestInit) => {
      const body = new URLSearchParams(init.body as string);
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('code')).toBe('the-code');
      expect(body.get('client_id')).toBe('cid');
      expect(body.get('client_secret')).toBe('sec');
      expect(body.get('redirect_uri')).toBe('https://x/cb');
      return new Response(JSON.stringify({ id_token: 'idt', access_token: 'at' }), { status: 200 });
    });
    const idToken = await exchangeCodeForIdToken(
      { code: 'the-code', clientId: 'cid', clientSecret: 'sec', redirectUri: 'https://x/cb' },
      fetchFn as unknown as typeof fetch,
    );
    expect(idToken).toBe('idt');
    expect(fetchFn.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token');
  });

  it('throws when Google rejects the code', async () => {
    const fetchFn = async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
    await expect(
      exchangeCodeForIdToken({ code: 'x', clientId: 'c', clientSecret: 's', redirectUri: 'r' }, fetchFn as typeof fetch),
    ).rejects.toThrow(/invalid_grant|400/);
  });
});

describe('verifyGoogleIdToken', () => {
  const claims = {
    sub: '123',
    email: 'a@blueprintcode.ai',
    email_verified: true,
    hd: 'blueprintcode.ai',
    name: 'A',
    nonce: 'nc',
  };
  const verify = vi.fn(async () => ({ payload: claims }));

  it('verifies against Google issuer + our client id and checks the nonce', async () => {
    const out = await verifyGoogleIdToken('idt', { clientId: 'cid', nonce: 'nc' }, verify);
    expect(out).toEqual({ sub: '123', email: 'a@blueprintcode.ai', emailVerified: true, hd: 'blueprintcode.ai', name: 'A' });
    const [token, opts] = verify.mock.calls[0] as unknown as [string, { issuer: string[]; audience: string }];
    expect(token).toBe('idt');
    expect(opts.audience).toBe('cid');
    expect(opts.issuer).toEqual(expect.arrayContaining(['https://accounts.google.com', 'accounts.google.com']));
  });

  it('rejects a nonce mismatch (replayed token)', async () => {
    await expect(verifyGoogleIdToken('idt', { clientId: 'cid', nonce: 'other' }, verify)).rejects.toThrow(/nonce/i);
  });

  it('propagates signature/audience failures from the verifier', async () => {
    const bad = async () => {
      throw new Error('signature verification failed');
    };
    await expect(verifyGoogleIdToken('idt', { clientId: 'cid', nonce: 'nc' }, bad)).rejects.toThrow(/signature/);
  });

  it('treats a missing hd or email_verified as false/undefined rather than throwing', async () => {
    const v = async () => ({ payload: { sub: '1', email: 'x@gmail.com' } });
    const out = await verifyGoogleIdToken('idt', { clientId: 'cid', nonce: undefined }, v);
    expect(out.emailVerified).toBe(false);
    expect(out.hd).toBeUndefined();
  });
});

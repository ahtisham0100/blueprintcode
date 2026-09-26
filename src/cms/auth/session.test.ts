import { describe, expect, it } from 'vitest';
import { SESSION_COOKIE, readSessionCookie, sessionCookie, signSession, verifySession } from './session';

const SECRET = 'test-secret-that-is-long-enough-for-hs256-0123456789';
const NOW = 1_800_000_000; // seconds

describe('signSession / verifySession', () => {
  it('round-trips the user id and email', async () => {
    const token = await signSession({ userId: 'u1', email: 'a@blueprintcode.ai' }, SECRET, { now: NOW });
    await expect(verifySession(token, SECRET, { now: NOW + 60 })).resolves.toEqual({
      userId: 'u1',
      email: 'a@blueprintcode.ai',
    });
  });

  it('expires after the ttl (default 8 hours)', async () => {
    const token = await signSession({ userId: 'u1', email: 'a@blueprintcode.ai' }, SECRET, { now: NOW });
    await expect(verifySession(token, SECRET, { now: NOW + 8 * 3600 - 1 })).resolves.not.toBeNull();
    await expect(verifySession(token, SECRET, { now: NOW + 8 * 3600 + 1 })).resolves.toBeNull();
  });

  it('rejects a tampered token, a foreign secret and garbage', async () => {
    const token = await signSession({ userId: 'u1', email: 'a@blueprintcode.ai' }, SECRET, { now: NOW });
    const [h, p, s] = token.split('.');
    await expect(verifySession(`${h}.${p}x.${s}`, SECRET, { now: NOW })).resolves.toBeNull();
    await expect(verifySession(token, 'another-secret-another-secret-another-secret', { now: NOW })).resolves.toBeNull();
    await expect(verifySession('not-a-jwt', SECRET, { now: NOW })).resolves.toBeNull();
    await expect(verifySession('', SECRET, { now: NOW })).resolves.toBeNull();
  });

  it('rejects a token that Payload itself would have issued (different purpose)', async () => {
    // Same secret, but not our audience/issuer.
    const { SignJWT } = await import('jose');
    const foreign = await new SignJWT({ id: 'u1', collection: 'users' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(NOW)
      .setExpirationTime(NOW + 3600)
      .sign(new TextEncoder().encode(SECRET));
    await expect(verifySession(foreign, SECRET, { now: NOW })).resolves.toBeNull();
  });
});

describe('sessionCookie', () => {
  it('is HttpOnly, Lax, path=/, with the ttl as Max-Age, and Secure in production', () => {
    const c = sessionCookie('tok', { secure: true, maxAge: 100 });
    expect(c.startsWith(`${SESSION_COOKIE}=tok;`)).toBe(true);
    expect(c).toMatch(/HttpOnly/);
    expect(c).toMatch(/SameSite=Lax/);
    expect(c).toMatch(/Path=\//);
    expect(c).toMatch(/Max-Age=100/);
    expect(c).toMatch(/Secure/);
    expect(sessionCookie('tok', { secure: false, maxAge: 100 })).not.toMatch(/Secure/);
  });

  it('never sets a Domain attribute (the cookie must stay on the admin host only)', () => {
    expect(sessionCookie('tok', { secure: true, maxAge: 1 })).not.toMatch(/Domain=/i);
  });
});

describe('readSessionCookie', () => {
  it('extracts our cookie from a Cookie header among others', () => {
    const h = new Headers({ cookie: `foo=1; ${SESSION_COOKIE}=abc.def.ghi; bar=2` });
    expect(readSessionCookie(h)).toBe('abc.def.ghi');
  });
  it('returns null when absent', () => {
    expect(readSessionCookie(new Headers())).toBeNull();
    expect(readSessionCookie(new Headers({ cookie: 'foo=1' }))).toBeNull();
  });

  it('skips a blank duplicate (same name, different path) and takes the real one', () => {
    const h = new Headers({ cookie: `${SESSION_COOKIE}=; foo=1; ${SESSION_COOKIE}=abc.def.ghi` });
    expect(readSessionCookie(h)).toBe('abc.def.ghi');
    expect(readSessionCookie(new Headers({ cookie: `${SESSION_COOKIE}=` }))).toBeNull();
  });
});

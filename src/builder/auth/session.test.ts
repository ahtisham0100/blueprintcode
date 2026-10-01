import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { signSession } from '@/cms/auth/session';
import {
  clearCookie,
  clientCookie,
  signClientSession,
  signReviewLink,
  signReviewSession,
  verifyClientSession,
  verifyReviewLink,
  verifyReviewSession,
} from './session';

const SECRET = 'x'.repeat(40);
const NOW = 1_800_000_000;

describe('builder sessions', () => {
  it('round-trips a client session', async () => {
    const t = await signClientSession({ clientId: 'c1', email: 'a@b.com' }, SECRET, NOW);
    expect(await verifyClientSession(t, SECRET, NOW + 60)).toEqual({ clientId: 'c1', email: 'a@b.com' });
  });

  it('expires a client session after 14 days', async () => {
    const t = await signClientSession({ clientId: 'c1', email: 'a@b.com' }, SECRET, NOW);
    expect(await verifyClientSession(t, SECRET, NOW + 14 * 86400 + 1)).toBeNull();
  });

  it('rejects the wrong key, garbage and empty tokens', async () => {
    const t = await signClientSession({ clientId: 'c1', email: 'a@b.com' }, SECRET, NOW);
    expect(await verifyClientSession(t, 'y'.repeat(40), NOW)).toBeNull();
    expect(await verifyClientSession('not.a.jwt', SECRET, NOW)).toBeNull();
    expect(await verifyClientSession('', SECRET, NOW)).toBeNull();
    expect(await verifyClientSession(null, SECRET, NOW)).toBeNull();
  });

  it('never accepts one kind of token as another', async () => {
    const client = await signClientSession({ clientId: 'P-1', email: 'a@b.com' }, SECRET, NOW);
    const review = await signReviewSession({ projectId: 'P-1', email: 'j@blueprintcode.ai' }, SECRET, NOW);
    const link = await signReviewLink({ projectId: 'P-1', email: 'j@blueprintcode.ai' }, SECRET, NOW);
    expect(await verifyReviewSession(client, SECRET, NOW)).toBeNull();
    expect(await verifyReviewLink(client, SECRET, NOW)).toBeNull();
    expect(await verifyClientSession(review, SECRET, NOW)).toBeNull();
    expect(await verifyReviewSession(link, SECRET, NOW)).toBeNull();
    expect(await verifyClientSession(link, SECRET, NOW)).toBeNull();
    expect(await verifyReviewSession(review, SECRET, NOW)).toEqual({ projectId: 'P-1', email: 'j@blueprintcode.ai' });
    expect(await verifyReviewLink(link, SECRET, NOW)).toEqual({ projectId: 'P-1', email: 'j@blueprintcode.ai' });
  });

  it('does not accept a CMS session, even signed with the same key', async () => {
    const cms = await signSession({ userId: '1', email: 'j@blueprintcode.ai' }, SECRET, { now: NOW });
    expect(await verifyClientSession(cms, SECRET, NOW)).toBeNull();
    expect(await verifyReviewSession(cms, SECRET, NOW)).toBeNull();
  });

  it('rejects an unsigned (alg none) token', async () => {
    const none = await new SignJWT({ email: 'a@b.com' })
      .setProtectedHeader({ alg: 'HS512' })
      .setSubject('c1')
      .setIssuer('bpc-builder')
      .setAudience('bpc-builder-client')
      .setExpirationTime(NOW + 100)
      .sign(new TextEncoder().encode(SECRET.repeat(2)));
    expect(await verifyClientSession(none, SECRET, NOW)).toBeNull();
  });

  it('review links last five minutes', async () => {
    const link = await signReviewLink({ projectId: 'P-1', email: 'j@blueprintcode.ai' }, SECRET, NOW);
    expect(await verifyReviewLink(link, SECRET, NOW + 299)).not.toBeNull();
    expect(await verifyReviewLink(link, SECRET, NOW + 301)).toBeNull();
  });

  it('builds host-only HttpOnly cookies', () => {
    const c = clientCookie('tok', true);
    expect(c).toMatch(/^bpcb-client=tok; Path=\/; HttpOnly; SameSite=Lax; Max-Age=\d+; Secure$/);
    expect(c).not.toMatch(/Domain/i);
    expect(clearCookie('bpcb-review', false)).toBe('bpcb-review=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  });
});

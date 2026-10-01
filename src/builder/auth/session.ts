/* Builder sessions: HS256 JWTs signed with BUILDER_SECRET, one audience per
   kind so no token can stand in for another.

   - client:      a signed-in client (magic link). sub = client id.
   - review:      a BPC reviewer's session for ONE project. sub = project id.
   - review-link: the 5-minute hand-off from the CMS that opens a review session.

   None of these is ever accepted by the CMS (different key, issuer and
   audience), and the CMS session is never accepted here. */

import { SignJWT, jwtVerify } from 'jose';
import { CLIENT_COOKIE, CLIENT_SESSION_TTL, REVIEW_COOKIE, REVIEW_LINK_TTL, REVIEW_SESSION_TTL } from '../settings';

const ISSUER = 'bpc-builder';
const AUD = {
  client: 'bpc-builder-client',
  review: 'bpc-builder-review',
  reviewLink: 'bpc-builder-review-link',
} as const;
type Kind = keyof typeof AUD;

export type ClientSession = { clientId: string; email: string };
export type ReviewSession = { projectId: string; email: string };

const key = (secret: string) => new TextEncoder().encode(secret);
const nowSec = (now?: number) => now ?? Math.floor(Date.now() / 1000);

async function sign(kind: Kind, sub: string, email: string, secret: string, ttl: number, now?: number): Promise<string> {
  const iat = nowSec(now);
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuer(ISSUER)
    .setAudience(AUD[kind])
    .setIssuedAt(iat)
    .setExpirationTime(iat + ttl)
    .sign(key(secret));
}

async function verify(kind: Kind, token: string | null | undefined, secret: string, now?: number): Promise<{ sub: string; email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      issuer: ISSUER,
      audience: AUD[kind],
      algorithms: ['HS256'],
      currentDate: now === undefined ? undefined : new Date(now * 1000),
    });
    if (typeof payload.sub !== 'string' || !payload.sub || typeof payload.email !== 'string') return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export const signClientSession = (s: ClientSession, secret: string, now?: number) =>
  sign('client', s.clientId, s.email, secret, CLIENT_SESSION_TTL, now);
export async function verifyClientSession(token: string | null | undefined, secret: string, now?: number): Promise<ClientSession | null> {
  const v = await verify('client', token, secret, now);
  return v && { clientId: v.sub, email: v.email };
}

export const signReviewSession = (s: ReviewSession, secret: string, now?: number) =>
  sign('review', s.projectId, s.email, secret, REVIEW_SESSION_TTL, now);
export async function verifyReviewSession(token: string | null | undefined, secret: string, now?: number): Promise<ReviewSession | null> {
  const v = await verify('review', token, secret, now);
  return v && { projectId: v.sub, email: v.email };
}

export const signReviewLink = (s: ReviewSession, secret: string, now?: number) =>
  sign('reviewLink', s.projectId, s.email, secret, REVIEW_LINK_TTL, now);
export async function verifyReviewLink(token: string | null | undefined, secret: string, now?: number): Promise<ReviewSession | null> {
  const v = await verify('reviewLink', token, secret, now);
  return v && { projectId: v.sub, email: v.email };
}

/** Host-only (no Domain), HttpOnly, SameSite=Lax. maxAge 0 clears it. */
function cookie(name: string, value: string, maxAge: number, secure: boolean): string {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
export const clientCookie = (token: string, secure: boolean) => cookie(CLIENT_COOKIE, token, CLIENT_SESSION_TTL, secure);
export const reviewCookie = (token: string, secure: boolean) => cookie(REVIEW_COOKIE, token, REVIEW_SESSION_TTL, secure);
export const clearCookie = (name: string, secure: boolean) => cookie(name, '', 0, secure);

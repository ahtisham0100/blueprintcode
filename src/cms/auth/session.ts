/* CMS session: a short-lived HS256 JWT, signed with PAYLOAD_SECRET, carried in
   an HttpOnly cookie on the admin host. Issued only by the Google OAuth
   callback (handlers.ts) and read back by the Payload auth strategy
   (strategy.ts).

   The cookie is named `<cookiePrefix>-token` (payload.config.ts sets the
   prefix to "bpc") on purpose: Payload's own logout endpoint expires exactly
   that cookie, so its logout button works unchanged. Payload's built-in JWT
   strategy also sees the cookie, but rejects it (different protected header
   and a local-strategy-disabled collection) and yields no user, after which
   our strategy runs. */

import { SignJWT, jwtVerify } from 'jose';
import { CMS_COOKIE_PREFIX } from '../settings';

export const SESSION_COOKIE = `${CMS_COOKIE_PREFIX}-token`;
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const ISSUER = 'bpc-cms';
const AUDIENCE = 'bpc-cms-session';

export type Session = { userId: string; email: string };

/** The key both the OAuth callback (signing) and the auth strategy
 *  (verifying) must use. Deliberately the raw env var, NOT `payload.secret`:
 *  Payload derives that as a truncated sha256 of the same value, and using
 *  one on each side silently rejects every session. */
export function sessionSecret(env: Record<string, string | undefined> = process.env): string {
  const s = env.PAYLOAD_SECRET;
  if (!s) throw new Error('PAYLOAD_SECRET is not set');
  return s;
}

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSession(
  session: Session,
  secret: string,
  opts: { now?: number; ttlSeconds?: number } = {},
): Promise<string> {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const ttl = opts.ttlSeconds ?? SESSION_TTL_SECONDS;
  return new SignJWT({ email: session.email })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(session.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .sign(key(secret));
}

/** The session inside a valid, unexpired token we issued; null otherwise. */
export async function verifySession(token: string, secret: string, opts: { now?: number } = {}): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
      currentDate: opts.now === undefined ? undefined : new Date(opts.now * 1000),
    });
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/** Set-Cookie value for the session. No Domain attribute: the cookie belongs
 *  to the admin host alone, never to the public site or its demos. */
export function sessionCookie(token: string, opts: { secure: boolean; maxAge: number }): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${opts.maxAge}${opts.secure ? '; Secure' : ''}`;
}

/** First NON-EMPTY value for `name`. A browser can hold two cookies with the
 *  same name on different paths (e.g. an expired/blank one on /cms next to
 *  the real one on /) and sends both; a blank value is never a session. */
export function readCookie(headers: Headers, name: string): string | null {
  const raw = headers.get('cookie');
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const value = part.slice(eq + 1).trim();
    if (value) return value;
  }
  return null;
}

export function readSessionCookie(headers: Headers): string | null {
  return readCookie(headers, SESSION_COOKIE);
}

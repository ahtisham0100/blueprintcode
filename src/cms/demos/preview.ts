/* Preview links: admins open a draft demo on the PUBLIC host (which has no
   admin cookies, so pasted scripts can do no harm there) with a short-lived
   signed token. Signed with the same secret as sessions. */

import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'bpc-cms';
const AUDIENCE = 'bpc-demo-preview';
export const PREVIEW_TTL_SECONDS = 30 * 60;

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signPreviewToken(demoId: string | number, secret: string, opts: { now?: number } = {}): Promise<string> {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(demoId))
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + PREVIEW_TTL_SECONDS)
    .sign(key(secret));
}

/** The demo id the token is for, or null. A token is only good for one demo. */
export async function verifyPreviewToken(token: string, demoId: string | number, secret: string, opts: { now?: number } = {}): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
      currentDate: opts.now === undefined ? undefined : new Date(opts.now * 1000),
    });
    return payload.sub === String(demoId);
  } catch {
    return false;
  }
}

export function previewPath(demoId: string | number, token: string): string {
  return `/demo-preview/${demoId}?token=${encodeURIComponent(token)}`;
}

/* Preview links: editors open a draft on the PUBLIC host (which has no
   admin cookies, so pasted scripts can do no harm there) with a short-lived
   signed token. Signed with the same secret as sessions. One audience per
   collection, so a demo preview token can never open a post preview and
   vice versa (blog/preview.ts wraps this for posts). */

import { SignJWT, jwtVerify } from 'jose';

const ISSUER = 'bpc-cms';
export const PREVIEW_AUDIENCES = { demos: 'bpc-demo-preview', posts: 'bpc-post-preview' } as const;
export type PreviewAudience = (typeof PREVIEW_AUDIENCES)[keyof typeof PREVIEW_AUDIENCES];
export const PREVIEW_TTL_SECONDS = 30 * 60;

type Opts = { now?: number; audience?: PreviewAudience };

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signPreviewToken(docId: string | number, secret: string, opts: Opts = {}): Promise<string> {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(docId))
    .setIssuer(ISSUER)
    .setAudience(opts.audience ?? PREVIEW_AUDIENCES.demos)
    .setIssuedAt(now)
    .setExpirationTime(now + PREVIEW_TTL_SECONDS)
    .sign(key(secret));
}

/** True when the token is for this document, in this audience, and unexpired. */
export async function verifyPreviewToken(token: string, docId: string | number, secret: string, opts: Opts = {}): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      issuer: ISSUER,
      audience: opts.audience ?? PREVIEW_AUDIENCES.demos,
      algorithms: ['HS256'],
      currentDate: opts.now === undefined ? undefined : new Date(opts.now * 1000),
    });
    return payload.sub === String(docId);
  } catch {
    return false;
  }
}

export function previewPath(docId: string | number, token: string, base = '/demo-preview'): string {
  return `${base}/${docId}?token=${encodeURIComponent(token)}`;
}

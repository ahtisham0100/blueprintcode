/* Magic-link sign-in tokens. The link carries 32 random bytes; the database
   keeps only their SHA-256, so a leaked table has no working links. */

import { createHash, randomBytes } from 'node:crypto';

export function createLoginToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashLoginToken(token) };
}

export function hashLoginToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Shape of a token we issued: 43 base64url characters. */
export function looksLikeLoginToken(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
}

/** Lower-cased, trimmed address, or null when it isn't a plausible email. */
export function normaliseEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const e = input.trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z0-9-]{2,}$/.test(e)) return null;
  return e;
}

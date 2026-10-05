/* The Medusa Heads × Instantly partner pages. Signing the NDA on
   /medusa-instantly sets a short-lived HS256 cookie; /medusa-instantly/partner-room
   serves the confidential brief only when it verifies. Pure functions here; the
   route handlers supply env and request. */

import { SignJWT, jwtVerify } from 'jose';

export const PARTNERSHIP_PATH = '/medusa-instantly';
export const PARTNER_ROOM_PATH = '/medusa-instantly/partner-room';
export const NDA_API_PATH = '/api/medusa-instantly/nda';

export const NDA_VERSION = 'MH-INSTANTLY-2026-10-04-v1';
export const NDA_COOKIE = 'bpc_medusa_nda';
/** The room stays open for a day after signing; after that the gate is shown again. */
export const NDA_SESSION_TTL = 24 * 60 * 60;
/** Only Instantly staff may enter; the form says so and the server enforces it. */
export const PARTNER_EMAIL_DOMAIN = 'instantly.ai';
/** Blueprint Code AI's own addresses may also enter, to preview and test the room. */
export const INTERNAL_EMAIL_DOMAIN = 'blueprintcode.ai';

const ISSUER = 'bpc-medusa';
const AUDIENCE = 'bpc-medusa-partner-room';

export type NdaSession = { name: string; email: string; ndaVersion: string };

export type NdaInput = { name: string; email: string; accepted: boolean; ndaVersion: string };

/** Parses and validates the JSON body of the NDA form. Returns an error message
 *  for the visitor, or the clean input. */
export function parseNdaInput(body: unknown): { ok: true; value: NdaInput } | { ok: false; error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim().replace(/\s+/g, ' ').slice(0, 120) : '';
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const accepted = b.accepted === true || b.accepted === 'true' || b.accepted === 'on';
  const ndaVersion = typeof b.nda_version === 'string' && b.nda_version ? b.nda_version.slice(0, 64) : NDA_VERSION;

  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (!isPartnerEmail(email)) {
    return { ok: false, error: 'Please use your Instantly company email to access the confidential partner room.' };
  }
  if (!accepted) return { ok: false, error: 'Please accept the Confidentiality Agreement to continue.' };
  return { ok: true, value: { name, email, accepted: true, ndaVersion } };
}

/** A Blueprint Code AI signer: a preview, not a partner acceptance. */
export function isInternalEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);
}

export function isPartnerEmail(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at <= 0 || at !== email.indexOf('@')) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  return /^[^\s@]+$/.test(local) && (domain === PARTNER_EMAIL_DOMAIN || domain === INTERNAL_EMAIL_DOMAIN);
}

/** The signing key is derived from the configured secret, so even when
 *  PAYLOAD_SECRET is the fallback this token is never verifiable as a CMS
 *  session (different key bytes, issuer and audience). */
async function signingKey(secret: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`medusa-nda:${secret}`));
  return new Uint8Array(digest);
}

export async function signNdaSession(s: NdaSession, secret: string, nowSec = Math.floor(Date.now() / 1000)): Promise<string> {
  return new SignJWT({ name: s.name, email: s.email, nda: s.ndaVersion })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(s.email)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + NDA_SESSION_TTL)
    .sign(await signingKey(secret));
}

export async function verifyNdaSession(token: string | null | undefined, secret: string, nowSec?: number): Promise<NdaSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await signingKey(secret), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
      currentDate: nowSec === undefined ? undefined : new Date(nowSec * 1000),
    });
    if (typeof payload.email !== 'string' || !isPartnerEmail(payload.email)) return null;
    if (typeof payload.name !== 'string' || typeof payload.nda !== 'string') return null;
    return { name: payload.name, email: payload.email, ndaVersion: payload.nda };
  } catch {
    return null;
  }
}

/** Host-only, HttpOnly, scoped to the partner pages. maxAge 0 clears it. */
export function ndaCookie(token: string, secure: boolean, maxAge = NDA_SESSION_TTL): string {
  return `${NDA_COOKIE}=${token}; Path=${PARTNERSHIP_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=') || null;
  }
  return null;
}

/** MEDUSA_NDA_SECRET if set, else the CMS secret (already present on every
 *  deployment). Throws so a misconfigured deployment fails loudly, not open. */
export function ndaSecret(env: NodeJS.ProcessEnv = process.env): string {
  const s = env.MEDUSA_NDA_SECRET || env.PAYLOAD_SECRET;
  if (!s || s.length < 16) throw new Error('MEDUSA_NDA_SECRET (or PAYLOAD_SECRET) is not set');
  return s;
}

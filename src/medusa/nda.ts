/* The Medusa Heads × Instantly partner pages. Signing the NDA on
   /medusa-partner sets a short-lived HS256 cookie; /medusa-partner/partner-room
   serves the confidential brief only when it verifies. Pure functions here; the
   route handlers supply env and request. */

import { SignJWT, jwtVerify } from 'jose';

export const PARTNERSHIP_PATH = '/medusa-partner';
export const PARTNER_ROOM_PATH = '/medusa-partner/partner-room';
export const NDA_API_PATH = '/api/medusa-partner/nda';

export const NDA_VERSION = 'MH-PARTNER-2026-10-v2';
export const NDA_COOKIE = 'bpc_medusa_nda';
/** The room stays open for a day after signing; after that the gate is shown again. */
export const NDA_SESSION_TTL = 24 * 60 * 60;
/** Only Instantly staff may enter; the form says so and the server enforces it. */
export const PARTNER_EMAIL_DOMAIN = 'instantly.ai';
/** Blueprint Code AI's own addresses may also enter, to preview and test the room. */
export const INTERNAL_EMAIL_DOMAIN = 'blueprintcode.ai';
/** Individually invited signers outside those domains (lower-case). */
export const INVITED_EMAILS: ReadonlySet<string> = new Set(['mikkalayese@gmail.com']);

const ISSUER = 'bpc-medusa';
const AUDIENCE = 'bpc-medusa-partner-room';

export type NdaSession = { name: string; email: string; ndaVersion: string };

/** Company and role are asked for by the form but optional here (null when blank). */
export type NdaInput = {
  name: string;
  email: string;
  company: string | null;
  role: string | null;
  accepted: boolean;
  ndaVersion: string;
};

/** Parses and validates the JSON body of the NDA form. Returns an error message
 *  for the visitor, or the clean input. */
export function parseNdaInput(body: unknown): { ok: true; value: NdaInput } | { ok: false; error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, 120) : '');
  const name = text(b.name);
  const company = text(b.company) || null;
  const role = text(b.role) || null;
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const accepted = b.accepted === true || b.accepted === 'true' || b.accepted === 'on';
  const ndaVersion = typeof b.nda_version === 'string' && b.nda_version ? b.nda_version.slice(0, 64) : NDA_VERSION;

  if (!name) return { ok: false, error: 'Please enter your name.' };
  if (!isPartnerEmail(email)) {
    return { ok: false, error: 'Please use your Instantly company email to access the confidential partner room.' };
  }
  if (!accepted) return { ok: false, error: 'Please accept the Confidentiality Agreement to continue.' };
  return { ok: true, value: { name, email, company, role, accepted: true, ndaVersion } };
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
  if (!/^[^\s@]+$/.test(local)) return false;
  return domain === PARTNER_EMAIL_DOMAIN || domain === INTERNAL_EMAIL_DOMAIN || INVITED_EMAILS.has(email.toLowerCase());
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

/* Access codes. Signing the NDA no longer opens the room directly: the signer
   is emailed a private code, and entering it on /medusa-partner sets the
   room cookie. Codes are stored only as a keyed hash (Postgres, so a code works
   on any device) and in a signed "pending" cookie (so the signing browser
   works even without a database). */

export const ACCESS_API_PATH = '/api/medusa-partner/access';
export const PENDING_COOKIE = 'bpc_medusa_pending';
/** A code can be used, on any device, for a week after signing. */
export const ACCESS_CODE_TTL = 7 * 24 * 60 * 60;
const PENDING_AUDIENCE = 'bpc-medusa-access-pending';
/** No 0/O, 1/I/L: the code is read from an email and typed by hand. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

/** A fresh code, formatted "XXXX-XXXX". */
export function generateAccessCode(): string {
  const out: string[] = [];
  const buf = new Uint8Array(1);
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % CODE_ALPHABET.length);
  while (out.length < CODE_LENGTH) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) out.push(CODE_ALPHABET[buf[0] % CODE_ALPHABET.length]);
  }
  return `${out.slice(0, 4).join('')}-${out.slice(4).join('')}`;
}

/** What the visitor typed, as the 8 canonical characters, or null if it
 *  cannot be a code. Case, spaces and dashes don't matter. */
export function normaliseAccessCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const c = input.toUpperCase().replace(/[\s-]/g, '');
  if (c.length !== CODE_LENGTH) return null;
  for (const ch of c) if (!CODE_ALPHABET.includes(ch)) return null;
  return c;
}

/** Keyed hash of a normalised code; the code itself is never stored. */
export async function accessCodeHash(code: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`medusa-code:${secret}:${code}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function signPendingAccess(
  s: NdaSession & { codeHash: string },
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<string> {
  return new SignJWT({ name: s.name, email: s.email, nda: s.ndaVersion, code: s.codeHash })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(s.email)
    .setIssuer(ISSUER)
    .setAudience(PENDING_AUDIENCE)
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + ACCESS_CODE_TTL)
    .sign(await signingKey(secret));
}

/** The signer in the pending cookie, if it is valid and was issued for this code. */
export async function verifyPendingAccess(
  token: string | null | undefined,
  codeHash: string,
  secret: string,
  nowSec?: number,
): Promise<NdaSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await signingKey(secret), {
      issuer: ISSUER,
      audience: PENDING_AUDIENCE,
      algorithms: ['HS256'],
      currentDate: nowSec === undefined ? undefined : new Date(nowSec * 1000),
    });
    if (payload.code !== codeHash) return null;
    if (typeof payload.email !== 'string' || !isPartnerEmail(payload.email)) return null;
    if (typeof payload.name !== 'string' || typeof payload.nda !== 'string') return null;
    return { name: payload.name, email: payload.email, ndaVersion: payload.nda };
  } catch {
    return null;
  }
}

/** Sent only to the access endpoint. maxAge 0 clears it. */
export function pendingCookie(token: string, secure: boolean, maxAge = ACCESS_CODE_TTL): string {
  return `${PENDING_COOKIE}=${token}; Path=${ACCESS_API_PATH}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

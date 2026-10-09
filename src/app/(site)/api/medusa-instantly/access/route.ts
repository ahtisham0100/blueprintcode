/* POST /api/medusa-instantly/access — the "Already have an access code?" box
   on /medusa-instantly. A code emailed after signing the NDA (see ../nda) is
   checked against the signing browser's pending cookie, then the database;
   a match sets the cookie that opens /medusa-instantly/partner-room. */

import { NextResponse } from 'next/server';
import {
  ACCESS_API_PATH,
  PARTNER_ROOM_PATH,
  PENDING_COOKIE,
  accessCodeHash,
  ndaCookie,
  ndaSecret,
  normaliseAccessCode,
  readCookie,
  signNdaSession,
  verifyPendingAccess,
} from '@/medusa/nda';
import { redeemAccessCode } from '@/medusa/record';
import { SITE_URL } from '@/lib/seo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Best-effort brake on guessing, per server instance: codes have ~40 bits of
   entropy, so this only needs to stop a tight loop. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; since: number }>();

function tooManyAttempts(ip: string, now = Date.now()): boolean {
  const a = attempts.get(ip);
  if (!a || now - a.since > WINDOW_MS) {
    attempts.set(ip, { count: 1, since: now });
    if (attempts.size > 5000) attempts.clear();
    return false;
  }
  a.count += 1;
  return a.count > MAX_ATTEMPTS;
}

const INVALID = 'That code could not be verified. Check the code or request a new one.';

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid submission.' }, { status: 400 });
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (tooManyAttempts(ip)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 });
  }

  const code = normaliseAccessCode((body as { code?: unknown } | null)?.code);
  if (!code) return NextResponse.json({ ok: false, error: INVALID }, { status: 400 });

  const secret = ndaSecret();
  const codeHash = await accessCodeHash(code, secret);
  let session = await verifyPendingAccess(readCookie(req.headers.get('cookie'), PENDING_COOKIE), codeHash, secret);
  if (!session) {
    try {
      session = await redeemAccessCode(codeHash);
    } catch (e) {
      console.error(`[${ACCESS_API_PATH}] DB lookup failed:`, e);
    }
  }
  if (!session) return NextResponse.json({ ok: false, error: INVALID }, { status: 401 });

  const token = await signNdaSession(session, secret);
  const secure = (process.env.PUBLIC_SITE_URL ?? SITE_URL).startsWith('https://');
  return NextResponse.json(
    { ok: true, next: PARTNER_ROOM_PATH },
    { headers: { 'set-cookie': ndaCookie(token, secure), 'cache-control': 'no-store' } },
  );
}

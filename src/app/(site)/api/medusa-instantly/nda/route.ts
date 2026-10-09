/* POST /api/medusa-instantly/nda — the "Sign NDA & Enter" form on
   /medusa-instantly. Validates the signer (Instantly work email, box ticked),
   records the acceptance (Postgres + email to James), then sets the cookie
   that opens /medusa-instantly/partner-room. JSON in, JSON out. */

import { NextResponse } from 'next/server';
import { NDA_API_PATH, PARTNER_ROOM_PATH, ndaCookie, ndaSecret, parseNdaInput, signNdaSession } from '@/medusa/nda';
import { emailNdaAcceptance, storeNdaAcceptance } from '@/medusa/record';
import { SITE_URL } from '@/lib/seo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid submission.' }, { status: 400 });
  }
  const parsed = parseNdaInput(body);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });

  const { name, email, company, role, ndaVersion } = parsed.value;
  const acceptance = {
    name,
    email,
    company,
    role,
    ndaVersion,
    acceptedAt: new Date().toISOString(),
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: req.headers.get('user-agent'),
  };

  let stored = false;
  try {
    stored = await storeNdaAcceptance(acceptance);
  } catch (e) {
    console.error(`[${NDA_API_PATH}] DB write failed:`, e);
  }
  const emailStatus = await emailNdaAcceptance(acceptance);
  if (emailStatus.startsWith('error')) console.error(`[${NDA_API_PATH}] email failed: ${emailStatus}`);
  const emailed = emailStatus === 'sent';

  // Nothing recorded anywhere (both unconfigured, or both failing): don't open
  // the room silently. Locally, with neither set up, log it so dev still works.
  if (!stored && !emailed) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { ok: false, error: 'We could not record your acceptance. Please email james@blueprintcode.ai.' },
        { status: 502 },
      );
    }
    console.log(`[${NDA_API_PATH}] accepted (not recorded: no DATABASE_URL / RESEND_API_KEY):`, acceptance);
  }

  const token = await signNdaSession({ name, email, ndaVersion }, ndaSecret());
  const secure = (process.env.PUBLIC_SITE_URL ?? SITE_URL).startsWith('https://');
  return NextResponse.json(
    { ok: true, next: PARTNER_ROOM_PATH, stored, emailed },
    { headers: { 'set-cookie': ndaCookie(token, secure), 'cache-control': 'no-store' } },
  );
}

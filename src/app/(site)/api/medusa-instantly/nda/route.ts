/* POST /api/medusa-instantly/nda — the "Sign NDA & Request Code" form on
   /medusa-instantly. Validates the signer (Instantly work email, box ticked),
   records the acceptance (Postgres + email to James), then emails the signer
   a private access code. The room itself opens only when that code is entered
   (POST /api/medusa-instantly/access). JSON in, JSON out. */

import { NextResponse } from 'next/server';
import {
  NDA_API_PATH,
  accessCodeHash,
  generateAccessCode,
  ndaSecret,
  normaliseAccessCode,
  parseNdaInput,
  pendingCookie,
  signPendingAccess,
} from '@/medusa/nda';
import { emailAccessCode, emailNdaAcceptance, storeAccessCode, storeNdaAcceptance } from '@/medusa/record';
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
  const isProd = process.env.NODE_ENV === 'production';

  let stored = false;
  try {
    stored = await storeNdaAcceptance(acceptance);
  } catch (e) {
    console.error(`[${NDA_API_PATH}] DB write failed:`, e);
  }
  const emailStatus = await emailNdaAcceptance(acceptance);
  if (emailStatus.startsWith('error')) console.error(`[${NDA_API_PATH}] email failed: ${emailStatus}`);
  const emailed = emailStatus === 'sent';

  // Nothing recorded anywhere (both unconfigured, or both failing): don't issue
  // a code. Locally, with neither set up, log it so dev still works.
  if (!stored && !emailed) {
    if (isProd) {
      return NextResponse.json(
        { ok: false, error: 'We could not record your acceptance. Please email james@blueprintcode.ai.' },
        { status: 502 },
      );
    }
    console.log(`[${NDA_API_PATH}] accepted (not recorded: no DATABASE_URL / RESEND_API_KEY):`, acceptance);
  }

  const secret = ndaSecret();
  const code = generateAccessCode();
  const codeHash = await accessCodeHash(normaliseAccessCode(code)!, secret);
  const session = { name, email, ndaVersion };
  try {
    await storeAccessCode(codeHash, session);
  } catch (e) {
    // The pending cookie below still lets this browser redeem the code.
    console.error(`[${NDA_API_PATH}] access code DB write failed:`, e);
  }

  const codeStatus = await emailAccessCode(email, name, code);
  if (codeStatus !== 'sent') {
    if (isProd || codeStatus.startsWith('error')) {
      console.error(`[${NDA_API_PATH}] access code email failed: ${codeStatus}`);
      return NextResponse.json(
        {
          ok: false,
          error: 'Your acceptance is recorded, but we could not email your access code. Please email james@blueprintcode.ai.',
        },
        { status: 502 },
      );
    }
    console.log(`[${NDA_API_PATH}] access code for ${email} (not emailed: no RESEND_API_KEY): ${code}`);
  }

  const token = await signPendingAccess({ ...session, codeHash }, secret);
  const secure = (process.env.PUBLIC_SITE_URL ?? SITE_URL).startsWith('https://');
  return NextResponse.json(
    { ok: true, codeSent: true, stored, emailed },
    { headers: { 'set-cookie': pendingCookie(token, secure), 'cache-control': 'no-store' } },
  );
}

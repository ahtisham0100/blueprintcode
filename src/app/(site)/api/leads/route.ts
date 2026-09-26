import { NextResponse } from 'next/server';
import { checkAdminPassword } from '@/lib/adminAuth';
import { listLeads, isDbConfigured } from '@/lib/leads';

/* Admin-only: return stored contact-form leads for /admin/leads.

   Same single-password model as /api/deploy-demo, but gating READ access to the
   data — so the check happens here, server-side, and the password travels in the
   `x-admin-password` header (never in the URL). The /admin/leads page is a public
   shell; no lead data is returned without the password. */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const password = req.headers.get('x-admin-password') || '';

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Server not configured — set ADMIN_PASSWORD.' }, { status: 500 });
  }
  if (!checkAdminPassword(password)) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Storage not configured — set DATABASE_URL.' }, { status: 500 });
  }

  try {
    const leads = await listLeads();
    return NextResponse.json({ ok: true, leads });
  } catch (e) {
    console.error('[leads] read failed:', e);
    return NextResponse.json({ error: 'Could not read leads.', detail: String(e).slice(0, 200) }, { status: 502 });
  }
}

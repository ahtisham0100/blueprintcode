/* GET /demo-preview/<id>?token=… — a demo's latest draft, for admins.
   Served on the PUBLIC host on purpose: it has no admin cookies, so the
   pasted scripts cannot reach the CMS. The token is short-lived and bound
   to this one demo (cms/demos/preview.ts). Never cached, never indexed. */

import type { NextRequest } from 'next/server';
import { sessionSecret } from '@/cms/auth/session';
import { loadDemoDraft } from '@/cms/demos/load';
import { chromeTemplates } from '@/cms/demos/partials';
import { verifyPreviewToken } from '@/cms/demos/preview';
import { renderDemoDocument } from '@/cms/demos/render';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const headers = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' };

  if (!(await verifyPreviewToken(token, id, sessionSecret()))) {
    return new Response('Preview link is invalid or has expired. Open the demo in the CMS and click Preview again.', { status: 403, headers });
  }
  const demo = await loadDemoDraft(id);
  if (!demo) return new Response('Demo not found', { status: 404, headers });

  const { html } = renderDemoDocument(demo, { siteUrl: SITE_URL, preview: true, ...chromeTemplates() });
  return new Response(html, { headers: { ...headers, 'content-type': 'text/html; charset=utf-8' } });
}

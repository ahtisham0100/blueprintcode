/* GET /<slug> — a demo published from the CMS (Phase 4).
 *
 * Order of precedence on the site: real routes and static files first (the
 * 21 legacy demos under public/ are served by next.config's afterFiles
 * rewrite before this dynamic route is reached), then this handler, then
 * the [...missing] catch-all's 404. Behind CMS_PUBLIC until switch-over.
 *
 * Cached by Next's full route cache for a year; publishing revalidates the
 * path (cms/demos/revalidate.ts), so a change is live within seconds. */

import { permanentRedirect, redirect } from 'next/navigation';
import { isCmsPublic } from '@/lib/flags';
import { SITE_URL } from '@/lib/seo';
import { loadPublishedDemo, loadRedirect } from '@/cms/demos/load';
import { chromeTemplates } from '@/cms/demos/partials';
import { renderDemoDocument } from '@/cms/demos/render';

export const revalidate = 31536000;

type Ctx = { params: Promise<{ slug: string }> };

/** The site's own 404 page (not-found.tsx via /__not-found), as a response.
 *  A route handler's notFound() would only give the bare built-in page. */
async function siteNotFound(req: Request): Promise<Response> {
  const res = await fetch(new URL('/__not-found', req.url), { cache: 'force-cache' });
  return new Response(await res.text(), {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=60' },
  });
}

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!isCmsPublic()) return siteNotFound(req);

  const demo = await loadPublishedDemo(slug);
  if (!demo) {
    const r = await loadRedirect(`/${slug}`);
    if (r) (r.permanent ? permanentRedirect : redirect)(r.to);
    return siteNotFound(req);
  }

  const { html } = renderDemoDocument(demo, { siteUrl: SITE_URL, ...chromeTemplates() });
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=60',
    },
  });
}

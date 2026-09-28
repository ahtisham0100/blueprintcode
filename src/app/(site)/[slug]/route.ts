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

/** Path of the site's 404 page as a real route (not-found.tsx rendered by
 *  (site)/not-found-page). NOT underscore-prefixed: Next treats those
 *  folders as private and unroutable, which made this handler fetch itself. */
export const NOT_FOUND_PAGE_PATH = '/not-found-page';
const INTERNAL_HEADER = 'x-bpc-internal-404';

/** The site's own 404 page, as a response. A route handler's notFound()
 *  would only give the bare built-in page. Guarded against recursion: the
 *  internal fetch is marked, and a marked request never fetches again. */
async function siteNotFound(req: Request): Promise<Response> {
  const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, s-maxage=60' };
  if (req.headers.get(INTERNAL_HEADER)) return new Response('Not found', { status: 404, headers });
  // Explicit origin: req.url is normalised to "localhost" in dev, which is
  // the ADMIN host here and would bounce the request to production.
  const origin = (process.env.PUBLIC_SITE_URL ?? SITE_URL).replace(/\/$/, '');
  const url = `${origin}${NOT_FOUND_PAGE_PATH}`;
  try {
    const res = await fetch(url, { headers: { [INTERNAL_HEADER]: '1' }, next: { revalidate: 3600 } });
    const html = await res.text();
    if (res.ok && html.includes('not-found')) return new Response(html, { status: 404, headers });
    console.warn(`[slug] 404 page fetch of ${url} returned ${res.status} (${html.length} bytes, final url ${res.url})`);
  } catch (err) {
    console.warn(`[slug] 404 page fetch failed: ${String(err)}`);
  }
  return new Response('Not found', { status: 404, headers });
}

export async function GET(req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (req.headers.get(INTERNAL_HEADER)) return new Response('Not found', { status: 404 });
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

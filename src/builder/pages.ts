/* Pages under /builder on the public host:
   /builder              the app (one self-contained page built by builder/build.mjs)
   /builder/sign-in      where the emailed link lands: a button that POSTs the
                         token, so link scanners that open URLs in emails can't
                         use up the single-use link
   /builder/review       the CMS hand-off: turns a 5-minute review link into a
                         reviewer session for one project, then opens it */

import { reviewCookie, signReviewSession, verifyReviewLink } from './auth/session';
import { looksLikeLoginToken } from './auth/loginToken';
import { BUILDER_API, BUILDER_PATH } from './settings';

export type PageDeps = {
  secret: string;
  secure: boolean;
  siteOrigin: string;
  /** The built app page, or null when builder/build.mjs hasn't run. */
  appHtml: () => string | null;
};

/** The app runs inline scripts, so the policy allows them, but it can only
 *  talk to this origin and load fonts from Google: nothing typed into it can
 *  be sent anywhere else. */
export const APP_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob: https:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ');

const BASE = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' };

function html(status: number, body: string, extra: Record<string, string> = {}, cookies: string[] = []): Response {
  const h = new Headers({ ...BASE, 'content-type': 'text/html; charset=utf-8', 'content-security-policy': APP_CSP, ...extra });
  for (const c of cookies) h.append('set-cookie', c);
  return new Response(body, { status, headers: h });
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function smallPage(title: string, inner: string): string {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)} | Blueprint Builder</title>
<style>:root{--g:#0B1A2E;--i:#EAF1F8;--m:#8FA9C6;--l:#2C4A6E}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--g);color:var(--i);font:15.5px/1.55 "IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}
main{max-width:440px;width:100%;border:1px solid var(--l);border-radius:2px;padding:28px}p.k{font:12px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:var(--m);margin:0 0 6px}h1{font-size:22px;margin:0 0 12px}p{margin:0 0 16px}
button,a.btn{display:inline-block;font:600 15px/1.2 inherit;padding:11px 18px;border-radius:2px;border:1px solid var(--i);background:var(--i);color:var(--g);cursor:pointer;text-decoration:none}a{color:var(--i)}.m{color:var(--m);font-size:13.5px}:focus-visible{outline:2px solid var(--i);outline-offset:2px}</style>
</head><body><main><p class="k">BLUEPRINT BUILDER</p>${inner}</main></body></html>`;
}

export function signInPage(url: URL): Response {
  const token = url.searchParams.get('token');
  if (url.searchParams.get('error') || !looksLikeLoginToken(token)) {
    return html(
      400,
      smallPage(
        'Link expired',
        `<h1>That sign-in link has expired</h1><p>Sign-in links work once and only for 15 minutes. Ask for a new one from Blueprint Builder.</p><a class="btn" href="${BUILDER_PATH}">Back to Blueprint Builder</a>`,
      ),
    );
  }
  return html(
    200,
    smallPage(
      'Sign in',
      `<h1>Sign in to Blueprint Builder</h1><p>Continue to sign in on this device.</p>
<form method="post" action="${BUILDER_API}/auth/verify"><input type="hidden" name="token" value="${esc(token)}"><button type="submit">Continue</button></form>
<p class="m" style="margin:16px 0 0">Didn't ask for this? Close this page; nothing happens without the button.</p>`,
    ),
  );
}

export async function reviewEntry(url: URL, d: PageDeps): Promise<Response> {
  const link = await verifyReviewLink(url.searchParams.get('token'), d.secret);
  if (!link) {
    return html(
      403,
      smallPage('Review link expired', '<h1>That review link has expired</h1><p>Review links last five minutes. Open the project again from the CMS dashboard.</p>'),
    );
  }
  const session = await signReviewSession(link, d.secret);
  const h = new Headers({ ...BASE, location: `${d.siteOrigin}${BUILDER_PATH}#/blueprint` });
  h.append('set-cookie', reviewCookie(session, d.secure));
  return new Response(null, { status: 303, headers: h });
}

export async function handleBuilderPage(req: Request, path: string[], d: PageDeps): Promise<Response> {
  const url = new URL(req.url);
  if (path.length === 0) {
    const page = d.appHtml();
    if (!page) return new Response('Blueprint Builder has not been built. Run: node builder/build.mjs', { status: 503, headers: BASE });
    return html(200, page);
  }
  if (path.length === 1 && path[0] === 'sign-in') return signInPage(url);
  if (path.length === 1 && path[0] === 'review') return reviewEntry(url, d);
  return new Response('Not Found', { status: 404, headers: BASE });
}

import { NextResponse } from 'next/server';
import { repoConfig, ghHeaders as githubHeaders } from '@/lib/github';

/* Admin endpoint: commit an uploaded demo to public/<slug>/index.html in the
   GitHub repo, which triggers the normal Vercel deploy. Gated by a single shared
   password (ADMIN_PASSWORD). Requires a GitHub token with Contents:write.

   Env:
     ADMIN_PASSWORD   shared admin password
     GITHUB_TOKEN     PAT (fine-grained, this repo, Contents read/write)
     GITHUB_REPO      "owner/repo"      (default: ahtisham0100/blueprintcode)
     GITHUB_BRANCH    branch to commit  (default: main)
*/

export const runtime = 'nodejs';

// Single-segment paths that must not be shadowed by an uploaded demo.
const RESERVED = new Set([
  '', 'about', 'configurators', 'contact', 'insights', 'ppav-case-study', 'pricing',
  'prototypes', 'standards-and-credentials', 'demo-viewer', 'admin', 'api', 'partials', 'capabilities',
  'media', 'assets', 'demos', 'index', 'favicon.ico', 'robots.txt',
  'sitemap.xml', 'site.webmanifest', 'site.css',
]);

function validSlug(slug: string): boolean {
  // lowercase letters/numbers/hyphens, no leading/trailing hyphen, no dots/slashes
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && !RESERVED.has(slug);
}

// Shared demo watermark: uploaded demos must carry the same company-logo
// watermark as the committed demo pages, so it appears on /<slug> too.
const WATERMARK_TAG = '<script src="/partials/watermark.js" defer></script>';

// Robots noindex: demos are prototypes served at /<slug>, not marketing pages,
// so they must stay out of search results. Mirrors scripts/inject-noindex.mjs,
// which stamps the same tag into the committed demo pages at build time.
const ROBOTS_TAG = '<meta name="robots" content="noindex, nofollow">';

/** Insert the robots noindex meta into an uploaded HTML document if it has a
 *  <head> and no robots meta yet. Non-HTML uploads and pages that already carry
 *  a robots meta pass through unchanged. */
function injectNoindex(html: string): string {
  if (/<meta[^>]+name=["']robots["']/i.test(html)) return html; // already present
  const headOpen = html.match(/<head\b[^>]*>/i);
  if (headOpen) {
    const at = headOpen.index! + headOpen[0].length;
    return html.slice(0, at) + ROBOTS_TAG + html.slice(at);
  }
  const closeIdx = html.toLowerCase().indexOf('</head>');
  if (closeIdx !== -1) return html.slice(0, closeIdx) + ROBOTS_TAG + html.slice(closeIdx);
  return html; // no <head> — not a full page; leave it alone
}

/** Insert the watermark <script> into an uploaded HTML document if it isn't
 *  already present. Non-HTML uploads (or already-watermarked ones) pass through
 *  unchanged. */
function injectWatermark(html: string): string {
  if (html.includes('/partials/watermark.js')) return html; // already present
  const lower = html.toLowerCase();
  const isHtml =
    lower.includes('</head>') || lower.includes('</body>') || lower.includes('<html');
  if (!isHtml) return html; // don't touch binary / non-HTML uploads
  const headIdx = lower.indexOf('</head>');
  if (headIdx !== -1) return html.slice(0, headIdx) + WATERMARK_TAG + html.slice(headIdx);
  const bodyIdx = lower.indexOf('</body>');
  if (bodyIdx !== -1) return html.slice(0, bodyIdx) + WATERMARK_TAG + html.slice(bodyIdx);
  return html + WATERMARK_TAG;
}

/** The anchors scripts/inject-chrome.mjs needs to place the shared header,
 *  footer and stylesheet. A page missing any of them warns at build time, so a
 *  fragment is refused here rather than committed and left to break the deploy. */
function missingAnchors(html: string): string[] {
  const missing: string[] = [];
  if (!/<\/head>/i.test(html)) missing.push('</head>');
  if (!/<body[^>]*>/i.test(html)) missing.push('<body>');
  if (!/<\/body>/i.test(html)) missing.push('</body>');
  return missing;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(req: Request) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const cfg = repoConfig();

  if (!ADMIN_PASSWORD || !cfg) {
    return NextResponse.json(
      { error: 'Server not configured — set ADMIN_PASSWORD and GITHUB_TOKEN.' },
      { status: 500 },
    );
  }
  const { repo: REPO, branch: BRANCH } = cfg;

  let body: { password?: unknown; slug?: unknown; contentBase64?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
  const contentBase64 = typeof body.contentBase64 === 'string' ? body.contentBase64 : '';

  if (!timingSafeEqual(password, ADMIN_PASSWORD)) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }
  if (!validSlug(slug)) {
    return NextResponse.json(
      { error: 'Invalid slug — use lowercase letters, numbers and hyphens, and avoid reserved names.' },
      { status: 400 },
    );
  }
  if (!contentBase64) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  // ~5 MB raw cap (base64 is ~4/3 the raw size); keeps under GitHub Contents limits.
  if (Math.floor(contentBase64.length * 0.75) > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB).' }, { status: 413 });
  }

  let decoded: string;
  try {
    decoded = Buffer.from(contentBase64, 'base64').toString('utf8');
  } catch {
    return NextResponse.json({ error: 'Could not read the file.' }, { status: 400 });
  }

  // A demo has to be a whole page. The build stamps the shared header and footer
  // into every HTML file under public/, and a fragment gives it nothing to stamp
  // into — which used to surface as a failed deploy well after the upload.
  const missing = missingAnchors(decoded);
  if (missing.length) {
    return NextResponse.json(
      {
        error:
          `Not a complete HTML page — no ${missing.join(', ')}. A demo must be a full document ` +
          `(<html><head>…</head><body>…</body></html>), not a fragment or a partial.`,
      },
      { status: 400 },
    );
  }

  // Stamp the shared watermark and a robots noindex into the uploaded HTML
  // before committing, so an admin-uploaded demo carries both — matching the
  // committed demos.
  const injected = injectNoindex(injectWatermark(decoded));
  const contentToCommit =
    injected === decoded ? contentBase64 : Buffer.from(injected, 'utf8').toString('base64');

  const path = `public/${slug}/index.html`;
  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const ghHeaders = githubHeaders(cfg.token);

  // Existing file? need its sha to update in place.
  let sha: string | undefined;
  try {
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(BRANCH)}`, { headers: ghHeaders });
    if (getRes.ok) {
      const j = (await getRes.json()) as { sha?: string };
      sha = j.sha;
    } else if (getRes.status !== 404) {
      const detail = await getRes.text();
      return NextResponse.json(
        { error: `GitHub read failed (${getRes.status}).`, detail: detail.slice(0, 200) },
        { status: 502 },
      );
    }
  } catch (e) {
    return NextResponse.json({ error: 'Could not reach GitHub.', detail: String(e).slice(0, 200) }, { status: 502 });
  }

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: { ...ghHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `${sha ? 'Update' : 'Add'} demo: ${slug}`,
      content: contentToCommit,
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const detail = await putRes.text();
    return NextResponse.json(
      { error: `GitHub write failed (${putRes.status}).`, detail: detail.slice(0, 300) },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, slug, url: `/${slug}`, updated: Boolean(sha) });
}

import { NextResponse } from 'next/server';

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
  'prototypes', 'demo-viewer', 'admin', 'api', 'partials', 'capabilities',
  'media', 'assets', 'demos', 'index', 'favicon.ico', 'robots.txt',
  'sitemap.xml', 'site.webmanifest', 'site.css',
]);

function validSlug(slug: string): boolean {
  // lowercase letters/numbers/hyphens, no leading/trailing hyphen, no dots/slashes
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug) && !RESERVED.has(slug);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(req: Request) {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO = process.env.GITHUB_REPO || 'ahtisham0100/blueprintcode';
  const BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!ADMIN_PASSWORD || !GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'Server not configured — set ADMIN_PASSWORD and GITHUB_TOKEN.' },
      { status: 500 },
    );
  }

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

  const path = `public/${slug}/index.html`;
  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'blueprintcode-admin',
  };

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
      content: contentBase64,
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

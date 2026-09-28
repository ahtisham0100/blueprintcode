import type { MetadataRoute } from 'next';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { isBlogPublic, isCmsPublic } from '@/lib/flags';
import { SITE_URL } from '@/lib/seo';
import { NOTES } from './(content)/insights/notes';

/* Programmatic sitemap — replaces the old hand-maintained public/sitemap.xml.
 *
 * Two things it buys us over the static file:
 *   1. lastmod is derived from each route's source-file modification time, so a
 *      genuine content edit bumps the date automatically. (On a clean CI
 *      checkout every file shares the checkout time, so lastmod collapses to
 *      roughly deploy time there — still a truer signal than a frozen date.)
 *   2. The /insights/<slug> article URLs are generated from NOTES, the same
 *      source the pages render from, so a new field note can never be left out
 *      of the sitemap.
 *   3. The static demos in public/ are discovered from disk, so a demo added by
 *      the /admin uploader is listed on the next deploy with no edit here.
 *
 * Every public page is indexable. Only /admin (noindex, and disallowed in
 * robots.txt) is intentionally absent.
 */

// Next runs the build from the project root, so source files resolve under here.
const APP_DIR = path.join(process.cwd(), 'src', 'app', '(site)');

/** Newest modification time among the given app-relative source files. */
function lastModified(...files: string[]): Date {
  let newest = 0;
  for (const file of files) {
    try {
      const t = statSync(path.join(APP_DIR, file)).mtimeMs;
      if (t > newest) newest = t;
    } catch {
      // Missing file (e.g. renamed): skip; falls back to build time below.
    }
  }
  return newest > 0 ? new Date(newest) : new Date();
}

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency'];

/** A static route: URL path (no leading slash), the source file(s) whose mtime
 *  drives lastmod, and its crawl hints. */
const STATIC_ROUTES: {
  path: string;
  sources: string[];
  changeFrequency: ChangeFrequency;
  priority: number;
}[] = [
  { path: '', sources: ['page.tsx', 'Home.tsx'], changeFrequency: 'monthly', priority: 1 },
  { path: 'configurators', sources: ['(content)/configurators/page.tsx'], changeFrequency: 'monthly', priority: 0.8 },
  { path: 'services/3d-product-configurator-development', sources: ['(content)/services/3d-product-configurator-development/page.tsx'], changeFrequency: 'monthly', priority: 0.8 },
  { path: 'services/guided-selling-tools', sources: ['(content)/services/guided-selling-tools/page.tsx'], changeFrequency: 'monthly', priority: 0.8 },
  { path: 'prototypes', sources: ['(content)/prototypes/page.tsx'], changeFrequency: 'monthly', priority: 0.8 },
  { path: 'ppav-case-study', sources: ['(content)/ppav-case-study/page.tsx'], changeFrequency: 'monthly', priority: 0.8 },
  { path: 'pricing', sources: ['(content)/pricing/page.tsx'], changeFrequency: 'monthly', priority: 0.8 },
  { path: 'services', sources: ['(content)/services/page.tsx'], changeFrequency: 'monthly', priority: 0.7 },
  { path: 'services/wcag-compliance-audit-pricing', sources: ['(content)/services/wcag-compliance-audit-pricing/page.tsx', '../lib/accessibilityPlans.ts'], changeFrequency: 'monthly', priority: 0.8 },
  { path: 'insights', sources: ['(content)/insights/page.tsx', '(content)/insights/notes.tsx'], changeFrequency: 'weekly', priority: 0.7 },
  { path: 'about', sources: ['(content)/about/page.tsx'], changeFrequency: 'yearly', priority: 0.6 },
  { path: 'contact', sources: ['contact/page.tsx'], changeFrequency: 'yearly', priority: 0.5 },
  { path: 'standards-and-credentials', sources: ['(content)/standards-and-credentials/page.tsx', '(content)/standards-and-credentials/data.json'], changeFrequency: 'yearly', priority: 0.5 },
  { path: 'demo-viewer', sources: ['demo-viewer/page.tsx', 'demo-viewer/DemoPlayground.tsx'], changeFrequency: 'yearly', priority: 0.3 },
  { path: 'logo-preview', sources: ['logo-preview/page.tsx'], changeFrequency: 'yearly', priority: 0.2 },
];

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/** Top-level public/ folders that hold no standalone pages: shared partials
 *  (fragments, not documents), static assets, and a scratch upload that isn't
 *  a real demo. */
const NON_PAGE_DIRS = new Set(['partials', 'assets', 'media', 'bpc-capabilities-demo-test-delte']);

/** Every standalone HTML page under public/, as sitemap entries.
 *  public/<slug>/index.html is served at /<slug> (next.config.ts rewrites);
 *  any other file is served at its own path. A page whose rel=canonical names
 *  a different URL is a near-duplicate and is left for its canonical to cover —
 *  listing it would contradict the canonical and trigger a GSC warning. */
function staticDemoEntries(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(PUBLIC_DIR, full).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (!NON_PAGE_DIRS.has(rel)) walk(full);
        continue;
      }
      if (!entry.name.toLowerCase().endsWith('.html')) continue;

      const url = /^[^/]+\/index\.html$/.test(rel)
        ? `${SITE_URL}/${rel.slice(0, -'/index.html'.length)}`
        : `${SITE_URL}/${rel.split('/').map(encodeURIComponent).join('/')}`;

      const html = readFileSync(full, 'utf8');
      const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
      if (canonical && canonical.replace(/\/$/, '') !== url) continue;
      if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) continue;

      entries.push({
        url,
        lastModified: statSync(full).mtime,
        changeFrequency: 'monthly',
        priority: 0.4,
      });
    }
  };
  walk(PUBLIC_DIR);
  return entries;
}

/** Demos published from the CMS (Phase 4), once CMS_PUBLIC is on. A slug
 *  that still has a static file is served statically and listed above, so
 *  it is excluded here. */
async function cmsDemoEntries(staticSlugs: Set<string>): Promise<MetadataRoute.Sitemap> {
  if (!isCmsPublic()) return [];
  try {
    const [{ getPayload }, { default: config }, { demoSitemapEntries }] = await Promise.all([
      import('payload'),
      import('@payload-config'),
      import('@/cms/demos/sitemap'),
    ]);
    const payload = await getPayload({ config });
    const { docs } = await payload.find({ collection: 'demos', where: { _status: { equals: 'published' } }, limit: 500, depth: 0, overrideAccess: true });
    return demoSitemapEntries(docs as Parameters<typeof demoSitemapEntries>[0], SITE_URL, staticSlugs);
  } catch {
    return [];
  }
}

/** The blog (Phase 5): index pages, categories in use and published posts,
 *  once BLOG_PUBLIC is on. Until then /insights stays listed above. */
async function blogEntries(): Promise<MetadataRoute.Sitemap> {
  if (!isBlogPublic()) return [];
  try {
    const [{ loadAllPublishedPosts, loadCategories }, { blogSitemapEntries }] = await Promise.all([import('@/cms/blog/load'), import('@/cms/blog/sitemap')]);
    const [posts, categories] = await Promise.all([loadAllPublishedPosts(1), loadCategories()]);
    return blogSitemapEntries(posts, categories, SITE_URL);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_ROUTES.map((r) => ({
    url: r.path ? `${SITE_URL}/${r.path}` : `${SITE_URL}/`,
    lastModified: lastModified(...r.sources),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Field-note articles, derived from the same NOTES the pages render from, so
  // a new note can't be orphaned. lastmod is the note's own dateModified — the
  // real editorial date, which also matches the BlogPosting schema.
  const noteEntries = NOTES.map((note) => ({
    url: `${SITE_URL}/insights/${note.slug}`,
    lastModified: new Date(note.dateModified),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  const staticDemos = staticDemoEntries();
  const staticSlugs = new Set(staticDemos.map((e) => e.url.slice(SITE_URL.length + 1)));
  return [...staticEntries, ...noteEntries, ...(await blogEntries()), ...staticDemos, ...(await cmsDemoEntries(staticSlugs))];
}

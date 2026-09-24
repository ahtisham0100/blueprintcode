import type { MetadataRoute } from 'next';
import { statSync } from 'node:fs';
import path from 'node:path';
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
 *
 * Utility routes that set robots noindex (/admin, /logo-preview, /demo-viewer)
 * are intentionally absent — a sitemap should list only indexable pages.
 */

// Next runs the build from the project root, so source files resolve under here.
const APP_DIR = path.join(process.cwd(), 'src', 'app');

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
];

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticEntries, ...noteEntries];
}

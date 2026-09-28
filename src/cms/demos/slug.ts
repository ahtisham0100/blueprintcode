/* Demo slugs become top-level URLs (/<slug>), so they must not shadow a real
   route, a public file, or a CMS/media path. Same rules as the old /admin
   uploader, extended for the CMS. Pure. */

export const RESERVED_SLUGS = new Set([
  '',
  'about',
  'admin',
  'api',
  'assets',
  'blog',
  'capabilities',
  'cms',
  'configurators',
  'contact',
  'demo-preview',
  'demo-viewer',
  'demos',
  'favicon.ico',
  'index',
  'insights',
  'logo-preview',
  'media',
  'not-found-page',
  'partials',
  'ppav-case-study',
  'pricing',
  'prototypes',
  'robots.txt',
  'services',
  'site.css',
  'site.webmanifest',
  'sitemap.xml',
  'standards-and-credentials',
]);

const SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** null when valid, otherwise a message for the editor. */
export function validateDemoSlug(slug: unknown, reserved: Set<string> = RESERVED_SLUGS): string | null {
  if (typeof slug !== 'string' || !slug) return 'Slug is required.';
  if (slug.length > 80) return 'Slug must be 80 characters or fewer.';
  if (!SLUG.test(slug)) return 'Use lowercase letters, numbers and hyphens only (no leading or trailing hyphen).';
  if (reserved.has(slug)) return `"${slug}" is a reserved path on the site.`;
  return null;
}

/** "Muay Thai Customiser (v2)" → "muay-thai-customiser-v2" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

/* Sitemap entries for demos published from the CMS. Pure; the sitemap
   route loads the docs. Static demos under public/ are listed separately
   and take precedence when a slug exists in both places. */

export type DemoSitemapDoc = { slug?: string | null; _status?: string | null; updatedAt?: string | null; seo?: { noindex?: boolean | null; canonical?: string | null } | null };

export type SitemapEntry = { url: string; lastModified: Date; changeFrequency: 'monthly'; priority: number };

export function demoSitemapEntries(docs: DemoSitemapDoc[], siteUrl: string, exclude: Set<string> = new Set()): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const d of docs) {
    if (!d.slug || d._status !== 'published' || d.seo?.noindex || exclude.has(d.slug)) continue;
    const own = `${siteUrl}/${d.slug}`;
    // A page whose canonical points elsewhere is a duplicate; let the canonical cover it.
    if (d.seo?.canonical && d.seo.canonical.replace(/\/$/, '') !== own) continue;
    out.push({ url: own, lastModified: d.updatedAt ? new Date(d.updatedAt) : new Date(), changeFrequency: 'monthly', priority: 0.4 });
  }
  return out;
}

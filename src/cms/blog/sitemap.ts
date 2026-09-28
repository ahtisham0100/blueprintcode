/* Sitemap entries for the blog. Pure; the sitemap route loads the docs and
   only calls this when BLOG_PUBLIC is on. Mirrors demos/sitemap.ts. */

import { POSTS_PER_PAGE, pageCount } from './paginate';

export type PostSitemapDoc = {
  slug?: string | null;
  _status?: string | null;
  updatedAt?: string | null;
  seo?: { noindex?: boolean | null; canonical?: string | null } | null;
  category?: { slug?: string | null } | number | string | null;
};
export type CategorySitemapDoc = { slug?: string | null };

export type BlogSitemapEntry = { url: string; lastModified: Date; changeFrequency: 'weekly' | 'monthly'; priority: number };

/** Published, indexable posts whose canonical is their own URL. */
function listable(docs: PostSitemapDoc[], siteUrl: string): PostSitemapDoc[] {
  return docs.filter((d) => {
    if (!d.slug || d._status !== 'published' || d.seo?.noindex) return false;
    const own = `${siteUrl}/blog/${d.slug}`;
    return !(d.seo?.canonical && d.seo.canonical.replace(/\/$/, '') !== own);
  });
}

function newest(docs: PostSitemapDoc[]): Date {
  const t = Math.max(0, ...docs.map((d) => (d.updatedAt ? new Date(d.updatedAt).getTime() : 0)));
  return t > 0 ? new Date(t) : new Date();
}

export function postSitemapEntries(docs: PostSitemapDoc[], siteUrl: string): BlogSitemapEntry[] {
  return listable(docs, siteUrl).map((d) => ({
    url: `${siteUrl}/blog/${d.slug}`,
    lastModified: d.updatedAt ? new Date(d.updatedAt) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
}

export function categorySitemapEntries(categories: CategorySitemapDoc[], posts: PostSitemapDoc[], siteUrl: string): BlogSitemapEntry[] {
  const listed = listable(posts, siteUrl);
  const out: BlogSitemapEntry[] = [];
  for (const c of categories) {
    if (!c.slug) continue;
    const inCategory = listed.filter((p) => typeof p.category === 'object' && p.category?.slug === c.slug);
    if (!inCategory.length) continue;
    out.push({ url: `${siteUrl}/blog/category/${c.slug}`, lastModified: newest(inCategory), changeFrequency: 'weekly', priority: 0.5 });
  }
  return out;
}

export function indexSitemapEntries(posts: PostSitemapDoc[], siteUrl: string, perPage = POSTS_PER_PAGE): BlogSitemapEntry[] {
  const listed = listable(posts, siteUrl);
  const lastModified = newest(listed);
  const out: BlogSitemapEntry[] = [{ url: `${siteUrl}/blog`, lastModified, changeFrequency: 'weekly', priority: 0.7 }];
  for (let n = 2; n <= pageCount(listed.length, perPage); n++) {
    out.push({ url: `${siteUrl}/blog/page/${n}`, lastModified, changeFrequency: 'weekly', priority: 0.3 });
  }
  return out;
}

export function blogSitemapEntries(posts: PostSitemapDoc[], categories: CategorySitemapDoc[], siteUrl: string): BlogSitemapEntry[] {
  return [...indexSitemapEntries(posts, siteUrl), ...categorySitemapEntries(categories, posts, siteUrl), ...postSitemapEntries(posts, siteUrl)];
}

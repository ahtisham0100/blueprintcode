/* Which cached public paths a post change invalidates. Pure planner; the
   Posts hooks call Next's revalidatePath with the result. Mirrors
   demos/revalidate.ts, plus route patterns for the listings (every page
   number, every category, and every post — prev/next links change when a
   neighbour appears). */

export type PostLike = {
  slug?: string | null;
  _status?: string | null;
  category?: { slug?: string | null } | number | string | null;
};

/** revalidatePath(path, type): a concrete path, or a route pattern with type 'page'. */
export type RevalidateTarget = { path: string; type?: 'page' };

export const BLOG_LISTING_TARGETS: RevalidateTarget[] = [
  { path: '/blog' },
  { path: '/blog/page/[n]', type: 'page' },
  { path: '/blog/category/[slug]', type: 'page' },
  { path: '/blog/[slug]', type: 'page' },
  { path: '/blog/feed.xml' },
  { path: '/sitemap.xml' },
];

function categorySlug(doc: PostLike | null | undefined): string | null {
  const c = doc?.category;
  return c && typeof c === 'object' && c.slug ? c.slug : null;
}

function dedupe(targets: RevalidateTarget[]): RevalidateTarget[] {
  const seen = new Set<string>();
  return targets.filter((t) => {
    const k = `${t.type ?? ''}:${t.path}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function blogPathsToRevalidate(doc: PostLike, previousDoc?: PostLike | null): RevalidateTarget[] {
  const wasPublished = previousDoc?._status === 'published';
  const isPublished = doc._status === 'published';
  if (!wasPublished && !isPublished) return []; // draft-to-draft edits change nothing public

  const out: RevalidateTarget[] = [];
  if (doc.slug) out.push({ path: `/blog/${doc.slug}` });
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) out.push({ path: `/blog/${previousDoc.slug}` });
  for (const c of [categorySlug(doc), categorySlug(previousDoc)]) if (c) out.push({ path: `/blog/category/${c}` });
  return dedupe([...out, ...BLOG_LISTING_TARGETS]);
}

/** Post URLs worth telling IndexNow about: the post itself (new and, on rename, old). */
export function blogUrlsToPing(doc: PostLike, previousDoc: PostLike | null | undefined, siteUrl: string): string[] {
  return blogPathsToRevalidate(doc, previousDoc)
    .filter((t) => !t.type && /^\/blog\/[^/]+$/.test(t.path) && t.path !== '/blog/feed.xml')
    .map((t) => `${siteUrl}${t.path}`);
}

export function blogPathsToRevalidateOnDelete(doc: PostLike): RevalidateTarget[] {
  if (doc._status !== 'published') return [];
  const c = categorySlug(doc);
  return dedupe([...(doc.slug ? [{ path: `/blog/${doc.slug}` }] : []), ...(c ? [{ path: `/blog/category/${c}` }] : []), ...BLOG_LISTING_TARGETS]);
}

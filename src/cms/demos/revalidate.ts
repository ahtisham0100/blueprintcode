/* Which cached public paths a demo change invalidates. Pure planner; the
   Demos hooks call Next's revalidatePath with the result. */

export type DemoLike = { slug?: string | null; _status?: string | null; gallery?: { show?: boolean | null } | null };

export const ALWAYS_WITH_DEMOS = ['/sitemap.xml'];

export function pathsToRevalidate(doc: DemoLike, previousDoc?: DemoLike | null): string[] {
  const paths = new Set<string>();
  const wasPublished = previousDoc?._status === 'published';
  const isPublished = doc._status === 'published';
  if (!wasPublished && !isPublished) return []; // draft-to-draft edits change nothing public

  if (doc.slug) paths.add(`/${doc.slug}`);
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) paths.add(`/${previousDoc.slug}`);
  if (doc.gallery?.show || previousDoc?.gallery?.show) paths.add('/prototypes');
  for (const p of ALWAYS_WITH_DEMOS) paths.add(p);
  return [...paths];
}

/** Demo URLs worth telling IndexNow about after a change: the page itself
 *  (new and, on rename, old) — not the sitemap or gallery. */
export function urlsToPing(doc: DemoLike, previousDoc: DemoLike | null | undefined, siteUrl: string): string[] {
  return pathsToRevalidate(doc, previousDoc)
    .filter((p) => !ALWAYS_WITH_DEMOS.includes(p) && p !== '/prototypes')
    .map((p) => `${siteUrl}${p}`);
}

export function pathsToRevalidateOnDelete(doc: DemoLike): string[] {
  if (doc._status !== 'published') return [];
  return [...new Set([...(doc.slug ? [`/${doc.slug}`] : []), ...(doc.gallery?.show ? ['/prototypes'] : []), ...ALWAYS_WITH_DEMOS])];
}

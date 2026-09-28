/* Blog listing pagination. Pure. Page 1 is the listing itself (/blog,
   /blog/category/<slug>); page n >= 2 lives under /page/n. */

export const POSTS_PER_PAGE = 12;

export function pageCount(total: number, perPage = POSTS_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/** "2" → 2. Page 1 and anything that is not a plain positive integer → null (404). */
export function parsePageParam(value: string | undefined): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const n = Number(value);
  return n >= 2 ? n : null;
}

export function blogPageHref(base: string, n: number): string {
  return n >= 2 ? `${base}/page/${n}` : base;
}

/* Post slugs live under /blog/<slug>, so the only paths they must not shadow
   are the blog's own: the feed, the category and pagination prefixes. Shape
   rules are shared with demos (demos/slug.ts). Pure. */

import { validateDemoSlug } from '../demos/slug';

export { slugify } from '../demos/slug';

export const BLOG_RESERVED_SLUGS = new Set(['', 'feed.xml', 'feed', 'rss', 'rss.xml', 'atom.xml', 'category', 'categories', 'page', 'tag', 'tags', 'author', 'authors']);

/** null when valid, otherwise a message for the editor. */
export function validatePostSlug(slug: unknown): string | null {
  return validateDemoSlug(slug, BLOG_RESERVED_SLUGS);
}

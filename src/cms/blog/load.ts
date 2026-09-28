/* Reads posts, categories and authors for the public blog routes through
   Payload's local API. Every query here is published-only except the draft
   loader used by /blog-preview. */

import config from '@payload-config';
import { getPayload } from 'payload';
import type { Author, Category, Post } from '../../payload-types';
import { POSTS_PER_PAGE } from './paginate';

export type { Author, Category, Post };

const PUBLISHED = { _status: { equals: 'published' } } as const;
const NEWEST_FIRST = '-publishedAt';

async function db() {
  return getPayload({ config });
}

export type PostPage = { docs: Post[]; totalDocs: number; totalPages: number; page: number };

/** One page of published posts, newest first, optionally within a category. */
export async function loadPublishedPosts(opts: { page?: number; categoryId?: number | string; perPage?: number } = {}): Promise<PostPage> {
  const payload = await db();
  const where = opts.categoryId === undefined ? PUBLISHED : { and: [PUBLISHED, { category: { equals: opts.categoryId } }] };
  const r = await payload.find({
    collection: 'posts',
    where,
    sort: NEWEST_FIRST,
    limit: opts.perPage ?? POSTS_PER_PAGE,
    page: opts.page ?? 1,
    depth: 1,
    overrideAccess: true,
  });
  return { docs: r.docs, totalDocs: r.totalDocs, totalPages: r.totalPages, page: r.page ?? 1 };
}

/** Every published post (for the feed, the sitemap and static params). */
export async function loadAllPublishedPosts(depth = 1): Promise<Post[]> {
  const payload = await db();
  const r = await payload.find({ collection: 'posts', where: PUBLISHED, sort: NEWEST_FIRST, limit: 1000, depth, overrideAccess: true });
  return r.docs;
}

/** The published post at /blog/<slug>, with its cover, category, author and body relations populated. */
export async function loadPublishedPost(slug: string): Promise<Post | null> {
  const payload = await db();
  const r = await payload.find({ collection: 'posts', where: { and: [PUBLISHED, { slug: { equals: slug } }] }, limit: 1, depth: 2, overrideAccess: true });
  return r.docs[0] ?? null;
}

/** Latest version (draft or published) of a post by id, for previews. */
export async function loadPostDraft(id: string | number): Promise<Post | null> {
  const payload = await db();
  try {
    return (await payload.findByID({ collection: 'posts', id, depth: 2, draft: true, overrideAccess: true })) ?? null;
  } catch {
    return null;
  }
}

/** The published posts either side of one, by publish date. */
export async function loadAdjacentPosts(post: Pick<Post, 'id' | 'publishedAt'>): Promise<{ prev: Post | null; next: Post | null }> {
  if (!post.publishedAt) return { prev: null, next: null };
  const payload = await db();
  const base = { collection: 'posts' as const, limit: 1, depth: 0, overrideAccess: true };
  const [older, newer] = await Promise.all([
    payload.find({ ...base, where: { and: [PUBLISHED, { publishedAt: { less_than: post.publishedAt } }, { id: { not_equals: post.id } }] }, sort: '-publishedAt' }),
    payload.find({ ...base, where: { and: [PUBLISHED, { publishedAt: { greater_than: post.publishedAt } }, { id: { not_equals: post.id } }] }, sort: 'publishedAt' }),
  ]);
  return { prev: older.docs[0] ?? null, next: newer.docs[0] ?? null };
}

export async function loadCategories(): Promise<Category[]> {
  const payload = await db();
  return (await payload.find({ collection: 'categories', sort: 'name', limit: 200, depth: 0, overrideAccess: true })).docs;
}

export async function loadCategory(slug: string): Promise<Category | null> {
  const payload = await db();
  return (await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] ?? null;
}

/** Categories that have at least one published post, with counts, for the filter links. */
export async function loadCategoriesInUse(): Promise<{ category: Category; count: number }[]> {
  const payload = await db();
  const [cats, posts] = await Promise.all([loadCategories(), payload.find({ collection: 'posts', where: PUBLISHED, limit: 1000, depth: 0, overrideAccess: true, select: { category: true } })]);
  const counts = new Map<number, number>();
  for (const p of posts.docs) {
    const id = typeof p.category === 'object' && p.category ? p.category.id : p.category;
    if (typeof id === 'number') counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return cats.filter((c) => counts.has(c.id)).map((c) => ({ category: c, count: counts.get(c.id)! }));
}

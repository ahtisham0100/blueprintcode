import { describe, expect, it } from 'vitest';
import { BLOG_LISTING_TARGETS, blogPathsToRevalidate, blogPathsToRevalidateOnDelete, blogUrlsToPing } from './revalidate';

const paths = (targets: { path: string }[]) => targets.map((t) => t.path);
const listing = paths(BLOG_LISTING_TARGETS);

describe('blogPathsToRevalidate', () => {
  it('does nothing for draft-only edits', () => {
    expect(blogPathsToRevalidate({ slug: 'a', _status: 'draft' }, { slug: 'a', _status: 'draft' })).toEqual([]);
    expect(blogPathsToRevalidate({ slug: 'a', _status: 'draft' }, undefined)).toEqual([]);
  });

  it('refreshes the post, its category and every listing on publish', () => {
    const out = blogPathsToRevalidate({ slug: 'a', _status: 'published', category: { slug: 'strategy' } }, { slug: 'a', _status: 'draft' });
    expect(paths(out)).toEqual(['/blog/a', '/blog/category/strategy', ...listing]);
  });

  it('covers the listings as route patterns so every page number and neighbouring post refresh', () => {
    expect(BLOG_LISTING_TARGETS).toEqual(
      expect.arrayContaining([
        { path: '/blog' },
        { path: '/blog/page/[n]', type: 'page' },
        { path: '/blog/category/[slug]', type: 'page' },
        { path: '/blog/[slug]', type: 'page' },
        { path: '/blog/feed.xml' },
        { path: '/sitemap.xml' },
      ]),
    );
  });

  it('refreshes old and new URLs on a rename and both categories on a move', () => {
    const out = blogPathsToRevalidate(
      { slug: 'b', _status: 'published', category: { slug: 'cost' } },
      { slug: 'a', _status: 'published', category: { slug: 'strategy' } },
    );
    expect(paths(out)).toEqual(['/blog/b', '/blog/a', '/blog/category/cost', '/blog/category/strategy', ...listing]);
  });

  it('refreshes on unpublish so the post disappears, and copes with unpopulated categories', () => {
    const out = blogPathsToRevalidate({ slug: 'a', _status: 'draft', category: 3 }, { slug: 'a', _status: 'published', category: 3 });
    expect(paths(out)).toEqual(['/blog/a', ...listing]);
  });
});

describe('blogUrlsToPing', () => {
  it('pings post URLs only, never listings, feeds or categories', () => {
    expect(
      blogUrlsToPing({ slug: 'b', _status: 'published', category: { slug: 'c' } }, { slug: 'a', _status: 'published' }, 'https://blueprintcode.ai'),
    ).toEqual(['https://blueprintcode.ai/blog/b', 'https://blueprintcode.ai/blog/a']);
    expect(blogUrlsToPing({ slug: 'a', _status: 'draft' }, { slug: 'a', _status: 'draft' }, 'https://blueprintcode.ai')).toEqual([]);
  });
});

describe('blogPathsToRevalidateOnDelete', () => {
  it('only matters for published posts', () => {
    expect(blogPathsToRevalidateOnDelete({ slug: 'a', _status: 'draft' })).toEqual([]);
    expect(paths(blogPathsToRevalidateOnDelete({ slug: 'a', _status: 'published', category: { slug: 'x' } }))).toEqual(['/blog/a', '/blog/category/x', ...listing]);
  });
});

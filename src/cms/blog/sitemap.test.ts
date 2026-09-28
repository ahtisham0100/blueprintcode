import { describe, expect, it } from 'vitest';
import { blogSitemapEntries, categorySitemapEntries, indexSitemapEntries, postSitemapEntries } from './sitemap';

const SITE = 'https://blueprintcode.ai';
const posts = [
  { slug: 'a', _status: 'published', updatedAt: '2026-09-28T10:00:00.000Z', category: { slug: 'strategy' } },
  { slug: 'b', _status: 'draft', category: { slug: 'cost' } },
  { slug: 'c', _status: 'published', seo: { noindex: true }, category: { slug: 'cost' } },
  { slug: 'd', _status: 'published', seo: { canonical: 'https://elsewhere.example/d' } },
  { slug: 'e', _status: 'published', seo: { canonical: 'https://blueprintcode.ai/blog/e/' }, category: 4 },
  { slug: null, _status: 'published' },
];

describe('postSitemapEntries', () => {
  it('lists published, indexable posts with their own canonical, under /blog', () => {
    const out = postSitemapEntries(posts, SITE);
    expect(out.map((e) => e.url)).toEqual([`${SITE}/blog/a`, `${SITE}/blog/e`]);
    expect(out[0]).toMatchObject({ lastModified: new Date('2026-09-28T10:00:00.000Z'), changeFrequency: 'monthly', priority: 0.6 });
  });
});

describe('categorySitemapEntries', () => {
  it('lists only categories that have at least one listed post', () => {
    const cats = [{ slug: 'strategy' }, { slug: 'cost' }, { slug: 'empty' }, { slug: null }];
    // "cost" only has a draft and a noindex post → nothing to list there.
    expect(categorySitemapEntries(cats, posts, SITE).map((e) => e.url)).toEqual([`${SITE}/blog/category/strategy`]);
    expect(categorySitemapEntries(cats, posts, SITE)[0]).toMatchObject({ changeFrequency: 'weekly', priority: 0.5 });
  });
});

describe('indexSitemapEntries', () => {
  it('lists /blog and one entry per further page', () => {
    expect(indexSitemapEntries(posts, SITE, 12).map((e) => e.url)).toEqual([`${SITE}/blog`]);
    const many = Array.from({ length: 25 }, (_, i) => ({ slug: `p${i}`, _status: 'published' }));
    expect(indexSitemapEntries(many, SITE, 12).map((e) => e.url)).toEqual([`${SITE}/blog`, `${SITE}/blog/page/2`, `${SITE}/blog/page/3`]);
    expect(indexSitemapEntries([], SITE, 12).map((e) => e.url)).toEqual([`${SITE}/blog`]);
  });
  it('dates the index by the newest listed post', () => {
    expect(indexSitemapEntries(posts, SITE, 12)[0].lastModified).toEqual(new Date('2026-09-28T10:00:00.000Z'));
  });
});

describe('blogSitemapEntries', () => {
  it('combines index, categories and posts in that order', () => {
    const out = blogSitemapEntries(posts, [{ slug: 'strategy' }], SITE);
    expect(out.map((e) => e.url)).toEqual([`${SITE}/blog`, `${SITE}/blog/category/strategy`, `${SITE}/blog/a`, `${SITE}/blog/e`]);
  });
});

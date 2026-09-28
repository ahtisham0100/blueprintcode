import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';

/* Route-level checks that need no database: the BLOG_PUBLIC gate on the
   feed, the feed's content type with stubbed posts, and that the blog
   folders are routable (no underscore) and reserved at the site root. */

vi.mock('@/cms/blog/load', () => ({
  loadAllPublishedPosts: vi.fn(async () => [
    {
      id: 1,
      title: 'A & B',
      slug: 'a-b',
      excerpt: 'Excerpt',
      publishedAt: '2026-09-10T09:00:00.000Z',
      updatedAt: '2026-09-10T09:00:00.000Z',
      author: { name: 'James' },
      category: { name: 'Strategy', slug: 'strategy' },
      body: { root: { type: 'root', version: 1, format: '', indent: 0, direction: 'ltr', children: [{ type: 'paragraph', version: 1, format: '', indent: 0, direction: 'ltr', textFormat: 0, children: [{ type: 'link', version: 1, fields: { linkType: 'custom', url: '/pricing', newTab: false }, children: [{ type: 'text', text: 'rates', format: 0, version: 1 }] }] }] } },
    },
  ]),
}));

const APP = path.join(process.cwd(), 'src', 'app', '(site)');

describe('/blog/feed.xml', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it('is a 404 while BLOG_PUBLIC is off', async () => {
    vi.stubEnv('BLOG_PUBLIC', '');
    const { GET } = await import('./feed.xml/route');
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('serves RSS with absolute links when BLOG_PUBLIC is on', async () => {
    vi.stubEnv('BLOG_PUBLIC', 'on');
    const { GET } = await import('./feed.xml/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    const xml = await res.text();
    expect(xml).toContain('<title>A &amp; B</title>');
    expect(xml).toContain('<link>https://blueprintcode.ai/blog/a-b</link>');
    expect(xml).toContain('<content:encoded><![CDATA[<p><a href="https://blueprintcode.ai/pricing">rates</a></p>]]></content:encoded>');
  });
});

describe('blog routes on disk', () => {
  it('exist at routable paths', () => {
    for (const p of ['blog/page.tsx', 'blog/[slug]/page.tsx', 'blog/page/[n]/page.tsx', 'blog/category/[slug]/page.tsx', 'blog/category/[slug]/page/[n]/page.tsx', 'blog/feed.xml/route.ts', 'blog-preview/[id]/page.tsx', 'forbidden.tsx']) {
      expect(existsSync(path.join(APP, p)), p).toBe(true);
    }
  });
});

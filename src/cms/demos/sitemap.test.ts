import { describe, expect, it } from 'vitest';
import { demoSitemapEntries } from './sitemap';

const SITE = 'https://blueprintcode.ai';

describe('demoSitemapEntries', () => {
  it('lists published, indexable demos with their own canonical', () => {
    const out = demoSitemapEntries(
      [
        { slug: 'a', _status: 'published', updatedAt: '2026-09-28T10:00:00.000Z' },
        { slug: 'b', _status: 'draft' },
        { slug: 'c', _status: 'published', seo: { noindex: true } },
        { slug: 'd', _status: 'published', seo: { canonical: 'https://blueprintcode.ai/other' } },
        { slug: 'e', _status: 'published', seo: { canonical: 'https://blueprintcode.ai/e/' } },
        { slug: null, _status: 'published' },
      ],
      SITE,
    );
    expect(out.map((e) => e.url)).toEqual([`${SITE}/a`, `${SITE}/e`]);
    expect(out[0]).toMatchObject({ lastModified: new Date('2026-09-28T10:00:00.000Z'), changeFrequency: 'monthly', priority: 0.4 });
  });
  it('skips slugs that a static demo already covers', () => {
    expect(demoSitemapEntries([{ slug: 'woodlawn', _status: 'published' }], SITE, new Set(['woodlawn']))).toEqual([]);
  });
});

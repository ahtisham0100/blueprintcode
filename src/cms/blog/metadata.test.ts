import { describe, expect, it } from 'vitest';
import { listingMetadata, postDescription, postMetadata, postTitle, shareImage } from './metadata';
import { OG_IMAGE } from '../../lib/seo';

const cover = {
  url: 'https://media.blueprintcode.ai/media/cover.jpg',
  alt: 'Cover',
  width: 2000,
  height: 1200,
  sizes: { large: { url: 'https://media.blueprintcode.ai/media/cover-1600.webp', width: 1600, height: 960 } },
};

const post = {
  title: 'What does a product configurator cost in 2026?',
  slug: 'configurator-cost',
  excerpt: 'Realistic price bands.',
  cover,
  publishedAt: '2026-08-19T00:00:00.000Z',
  updatedAt: '2026-09-12T10:00:00.000Z',
  author: { name: 'James Michaelson' },
  category: { name: 'Cost & scope', slug: 'cost-scope' },
};

describe('postMetadata', () => {
  it('builds title, description, canonical, article OG and a large-image card from the cover', () => {
    const m = postMetadata(post);
    expect(m.title).toBe(post.title);
    expect(m.description).toBe('Realistic price bands.');
    expect(m.alternates).toEqual({ canonical: 'https://blueprintcode.ai/blog/configurator-cost' });
    expect(m.robots).toEqual({ index: true, follow: true, 'max-image-preview': 'large' });
    expect(m.openGraph).toMatchObject({
      siteName: 'Blueprint Code AI',
      locale: 'en_GB',
      type: 'article',
      url: 'https://blueprintcode.ai/blog/configurator-cost',
      title: post.title,
      description: 'Realistic price bands.',
      publishedTime: '2026-08-19T00:00:00.000Z',
      modifiedTime: '2026-09-12T10:00:00.000Z',
      authors: ['James Michaelson'],
      section: 'Cost & scope',
      images: [{ url: 'https://media.blueprintcode.ai/media/cover-1600.webp', width: 1600, height: 960, alt: 'Cover' }],
    });
    expect(m.twitter).toEqual({ card: 'summary_large_image' });
  });

  it('lets the SEO tab override title, description, canonical, share fields and noindex', () => {
    const m = postMetadata({
      ...post,
      seo: {
        metaTitle: 'Configurator cost 2026',
        description: 'Meta desc',
        canonical: 'https://blueprintcode.ai/insights/configurator-cost',
        noindex: true,
        ogTitle: 'Share title',
        ogDescription: 'Share desc',
        ogImage: { url: 'https://media.blueprintcode.ai/media/og.png', width: 1200, height: 630 },
      },
    });
    expect(m.title).toBe('Configurator cost 2026');
    expect(m.description).toBe('Meta desc');
    expect(m.alternates).toEqual({ canonical: 'https://blueprintcode.ai/insights/configurator-cost' });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.openGraph).toMatchObject({ title: 'Share title', description: 'Share desc', images: [{ url: 'https://media.blueprintcode.ai/media/og.png', width: 1200, height: 630 }] });
  });

  it('falls back to the site image and a summary card without a cover, and omits an empty description', () => {
    const m = postMetadata({ title: 'T', slug: 't', cover: 3 });
    expect(m).not.toHaveProperty('description');
    expect(m.openGraph).toMatchObject({ images: [OG_IMAGE] });
    expect(m.twitter).toEqual({ card: 'summary' });
  });

  it('marks previews noindex/nofollow with no canonical', () => {
    const m = postMetadata(post, { preview: true });
    expect(m.robots).toEqual({ index: false, follow: false });
    expect(m).not.toHaveProperty('alternates');
  });

  it('exposes the resolved title/description/image helpers', () => {
    expect(postTitle({ title: ' T ', seo: { metaTitle: '' } })).toBe('T');
    expect(postDescription({ excerpt: 'E', seo: { description: 'D' } })).toBe('D');
    expect(shareImage({ cover: null })).toBeNull();
    expect(shareImage({ cover: { url: 'https://m/x.png', width: 300, height: 200 } })).toEqual({ url: 'https://m/x.png', width: 300, height: 200, alt: undefined });
  });
});

describe('listingMetadata', () => {
  it('canonicalises page 1 to the listing and later pages to /page/n', () => {
    const one = listingMetadata({ title: 'Blog', description: 'D', path: '/blog' });
    expect(one.alternates).toEqual({ canonical: 'https://blueprintcode.ai/blog' });
    expect(one.title).toBe('Blog');
    const two = listingMetadata({ title: 'Blog', description: 'D', path: '/blog/category/strategy', page: 2 });
    expect(two.alternates).toEqual({ canonical: 'https://blueprintcode.ai/blog/category/strategy/page/2' });
    expect(two.title).toBe('Blog — page 2');
    expect(two.openGraph).toMatchObject({ type: 'website', url: 'https://blueprintcode.ai/blog/category/strategy/page/2', siteName: 'Blueprint Code AI' });
  });

  it('noindexes an empty listing but keeps links followable', () => {
    expect(listingMetadata({ title: 'C', description: 'D', path: '/blog/category/c', empty: true }).robots).toEqual({ index: false, follow: true });
    expect(listingMetadata({ title: 'C', description: 'D', path: '/blog/category/c' }).robots).toMatchObject({ index: true });
  });
});

import { describe, expect, it } from 'vitest';
import { SITE_URL, blogJsonLd, blogPostingJsonLd, breadcrumbListJsonLd, jsonLdScript } from './seo';

describe('blogPostingJsonLd', () => {
  it('builds a BlogPosting linked to the organisation and the blog', () => {
    const out = blogPostingJsonLd({
      title: 'What does a configurator cost?',
      description: 'Bands & variables',
      url: `${SITE_URL}/blog/configurator-cost`,
      datePublished: '2026-08-19T00:00:00.000Z',
      dateModified: '2026-09-12T00:00:00.000Z',
      wordCount: 729,
      image: `${SITE_URL}/media/cover.jpg`,
      author: { name: 'James Michaelson', jobTitle: 'Founder', url: `${SITE_URL}/about#james`, sameAs: ['https://www.linkedin.com/in/x'] },
      category: 'Cost & scope',
    });
    expect(out).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'What does a configurator cost?',
      description: 'Bands & variables',
      url: `${SITE_URL}/blog/configurator-cost`,
      mainEntityOfPage: `${SITE_URL}/blog/configurator-cost`,
      datePublished: '2026-08-19T00:00:00.000Z',
      dateModified: '2026-09-12T00:00:00.000Z',
      wordCount: 729,
      image: `${SITE_URL}/media/cover.jpg`,
      articleSection: 'Cost & scope',
      author: { '@type': 'Person', name: 'James Michaelson', jobTitle: 'Founder', url: `${SITE_URL}/about#james`, sameAs: ['https://www.linkedin.com/in/x'] },
      publisher: { '@id': `${SITE_URL}/#organization` },
      isPartOf: { '@type': 'Blog', '@id': `${SITE_URL}/blog#blog`, url: `${SITE_URL}/blog` },
    });
  });

  it('omits what it does not have rather than emitting empty fields', () => {
    const out = blogPostingJsonLd({ title: 'T', url: `${SITE_URL}/blog/t` }) as Record<string, unknown>;
    for (const k of ['description', 'image', 'wordCount', 'dateModified', 'articleSection', 'author']) expect(out).not.toHaveProperty(k);
    expect(blogPostingJsonLd({ title: 'T', url: 'u', author: { name: 'Anon' } })).toMatchObject({ author: { '@type': 'Person', name: 'Anon' } });
    // dateModified falls back to datePublished so the two never disagree by omission.
    expect(blogPostingJsonLd({ title: 'T', url: 'u', datePublished: '2026-01-01' })).toMatchObject({ dateModified: '2026-01-01' });
  });
});

describe('breadcrumbListJsonLd', () => {
  it('numbers the trail from 1', () => {
    expect(breadcrumbListJsonLd([{ name: 'Home', url: `${SITE_URL}/` }, { name: 'Blog', url: `${SITE_URL}/blog` }, { name: 'Post', url: `${SITE_URL}/blog/p` }])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: 'Post', item: `${SITE_URL}/blog/p` },
      ],
    });
  });
});

describe('blogJsonLd', () => {
  it('describes the blog itself with its posts', () => {
    const out = blogJsonLd([{ title: 'A', url: `${SITE_URL}/blog/a`, datePublished: '2026-01-01' }]);
    expect(out).toMatchObject({ '@type': 'Blog', '@id': `${SITE_URL}/blog#blog`, url: `${SITE_URL}/blog`, publisher: { '@id': `${SITE_URL}/#organization` } });
    const posts = (out as { blogPost: Record<string, unknown>[] }).blogPost;
    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ '@type': 'BlogPosting', headline: 'A' });
    expect(posts[0]).not.toHaveProperty('@context');
  });
});

describe('jsonLdScript', () => {
  it('escapes < so structured data can never close its script tag', () => {
    expect(jsonLdScript({ a: '</script><b>' })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
  });
});

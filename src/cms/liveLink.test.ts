import { describe, expect, it } from 'vitest';
import { liveLinkState, liveUrl } from './liveLink';

const base = { siteUrl: 'https://blueprintcode.ai', pathPrefix: '/blog/' };

describe('liveUrl', () => {
  it('joins site, prefix and slug with exactly one slash each', () => {
    expect(liveUrl({ ...base, slug: 'cost' })).toBe('https://blueprintcode.ai/blog/cost');
    expect(liveUrl({ siteUrl: 'https://blueprintcode.ai/', pathPrefix: '/', slug: 'woodlawn' })).toBe('https://blueprintcode.ai/woodlawn');
    expect(liveUrl({ siteUrl: 'http://127.0.0.1:5000', pathPrefix: 'blog', slug: 'a' })).toBe('http://127.0.0.1:5000/blog/a');
  });
});

describe('liveLinkState', () => {
  it('shows nothing until the document has a published version', () => {
    expect(liveLinkState({ ...base, hasPublishedDoc: false, publishedSlug: 'cost', sectionPublic: true })).toEqual({ kind: 'none' });
    expect(liveLinkState({ ...base, hasPublishedDoc: true, publishedSlug: null, sectionPublic: true })).toEqual({ kind: 'none' });
  });

  it('links the published slug when the section is public', () => {
    expect(liveLinkState({ ...base, hasPublishedDoc: true, publishedSlug: 'cost', sectionPublic: true })).toEqual({ kind: 'live', href: 'https://blueprintcode.ai/blog/cost' });
  });

  it('explains when it is published but the section is switched off', () => {
    expect(liveLinkState({ ...base, hasPublishedDoc: true, publishedSlug: 'cost', sectionPublic: false, flagName: 'BLOG_PUBLIC' })).toEqual({
      kind: 'off',
      href: 'https://blueprintcode.ai/blog/cost',
      reason: 'Published, but not on the site yet: BLOG_PUBLIC is off.',
    });
  });
});

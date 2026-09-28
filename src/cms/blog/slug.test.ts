import { describe, expect, it } from 'vitest';
import { BLOG_RESERVED_SLUGS, validatePostSlug } from './slug';
import { RESERVED_SLUGS } from '../demos/slug';

describe('validatePostSlug', () => {
  it('accepts ordinary post slugs, including words that are reserved at the site root', () => {
    expect(validatePostSlug('configurator-cost')).toBeNull();
    expect(validatePostSlug('2d-vs-3d')).toBeNull();
    // /blog/pricing is fine: only the site root reserves "pricing".
    expect(validatePostSlug('pricing')).toBeNull();
    expect(validatePostSlug('cms')).toBeNull();
  });

  it('rejects the paths the blog itself uses', () => {
    for (const s of ['feed.xml', 'category', 'page']) {
      expect(BLOG_RESERVED_SLUGS.has(s)).toBe(true);
      expect(validatePostSlug(s)).toEqual(expect.any(String));
    }
    expect(validatePostSlug('category')).toMatch(/reserved/);
  });

  it('applies the shared shape rules', () => {
    expect(validatePostSlug('')).toMatch(/required/);
    expect(validatePostSlug('Has Caps')).toMatch(/lowercase/);
    expect(validatePostSlug('-lead')).toMatch(/hyphen/);
    expect(validatePostSlug('a'.repeat(81))).toMatch(/80/);
    expect(validatePostSlug(42)).toMatch(/required/);
  });

  it('keeps blog and blog-preview reserved at the site root so no demo can shadow them', () => {
    expect(RESERVED_SLUGS.has('blog')).toBe(true);
    expect(RESERVED_SLUGS.has('blog-preview')).toBe(true);
  });
});

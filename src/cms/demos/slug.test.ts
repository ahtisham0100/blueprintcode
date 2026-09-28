import { describe, expect, it } from 'vitest';
import { RESERVED_SLUGS, slugify, validateDemoSlug } from './slug';

describe('validateDemoSlug', () => {
  it('accepts the shapes existing demos use', () => {
    for (const s of ['woodlawn', 'premium-muay-thai-customiser', 'sheet-01-configure-visualise', 'max-kpi-japan', 'a1'])
      expect(validateDemoSlug(s), s).toBeNull();
  });

  it('rejects bad shapes with a message', () => {
    expect(validateDemoSlug('')).toMatch(/required/);
    expect(validateDemoSlug(undefined)).toMatch(/required/);
    expect(validateDemoSlug('Muay Thai')).toMatch(/lowercase/);
    expect(validateDemoSlug('-lead')).toMatch(/hyphen/);
    expect(validateDemoSlug('trail-')).toMatch(/hyphen/);
    expect(validateDemoSlug('a/b')).toMatch(/lowercase/);
    expect(validateDemoSlug('x'.repeat(81))).toMatch(/80/);
  });

  it('refuses to shadow real routes, files and CMS paths', () => {
    for (const s of ['about', 'cms', 'media', 'api', 'admin', 'blog', 'demo-preview', 'services', 'not-found-page'])
      expect(validateDemoSlug(s), s).toMatch(/reserved/);
    expect(RESERVED_SLUGS.has('prototypes')).toBe(true);
    // Dotted names (robots.txt, sitemap.xml) never pass the shape check anyway.
    expect(validateDemoSlug('robots.txt')).not.toBeNull();
  });
});

describe('slugify', () => {
  it('derives a valid slug from a title', () => {
    expect(slugify('Muay Thai Customiser (v2)')).toBe('muay-thai-customiser-v2');
    expect(validateDemoSlug(slugify('  Maison Cacao — Dashboard!  '))).toBeNull();
    expect(slugify('x'.repeat(100)).length).toBeLessThanOrEqual(80);
  });
});

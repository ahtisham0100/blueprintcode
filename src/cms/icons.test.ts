import { describe, expect, it } from 'vitest';
import { COLLECTION_ICONS, ICONS, collectionIconCss, iconDataUri, iconSvg } from './icons';
import config from './collectionSlugs';

describe('icon set', () => {
  it('draws every icon on a 24px grid with only paths, circles and rects', () => {
    for (const [name, inner] of Object.entries(ICONS)) {
      expect(inner, name).toMatch(/^(<(path|circle|rect) [^>]+\/>)+$/);
      expect(inner, name).not.toMatch(/fill=|stroke=|style=/); // colour comes from currentColor
    }
  });

  it('renders standalone SVG in the blueprint line style', () => {
    const svg = iconSvg('posts');
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"')).toBe(true);
    expect(svg).toContain(ICONS.posts);
    expect(iconSvg('media', { stroke: '#000' })).toContain('stroke="#000"');
  });

  it('encodes a data URI usable as a CSS mask (no raw quotes, # or <)', () => {
    const uri = iconDataUri('users');
    expect(uri.startsWith('url("data:image/svg+xml,')).toBe(true);
    const body = uri.slice('url("data:image/svg+xml,'.length, -2);
    expect(body).not.toMatch(/[#<>"]/);
    expect(decodeURIComponent(body)).toBe(iconSvg('users', { stroke: '#000' }));
  });
});

describe('collection icons', () => {
  it('lists exactly the collections payload.config registers', async () => {
    const mods = await Promise.all([
      import('./collections/Posts'),
      import('./collections/Categories'),
      import('./collections/Authors'),
      import('./collections/Demos'),
      import('./collections/Media'),
      import('./collections/Redirects'),
      import('./collections/Users'),
    ]);
    const slugs = mods.map((m) => (Object.values(m).find((v) => v && typeof v === 'object' && 'slug' in v && 'fields' in v) as { slug: string }).slug);
    expect([...slugs].sort()).toEqual([...config].sort());
    const src = (await import('node:fs')).readFileSync('src/payload.config.ts', 'utf8');
    expect(src).toMatch(/collections: \[Posts, Categories, Authors, Demos, Media, Redirects, Users\]/);
  }, 30_000); // loads Lexical: slow under a parallel full run

  it('covers every collection in the admin', () => {
    for (const slug of config) expect(COLLECTION_ICONS[slug], slug).toBeDefined();
  });

  it('styles nav links, dashboard cards and list titles by the ids Payload renders', () => {
    const css = collectionIconCss();
    for (const slug of Object.keys(COLLECTION_ICONS)) {
      expect(css).toContain(`#nav-${slug}::before`);
      expect(css).toContain(`#card-${slug} .card__title::before`);
      expect(css).toContain(`.collection-list--${slug} .list-header__title::before`);
    }
    expect(css).toContain('mask-image:url("data:image/svg+xml,');
    expect(css).toContain('-webkit-mask-image:');
    expect(css).not.toContain('<');
  });
});

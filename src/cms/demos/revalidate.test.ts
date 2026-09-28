import { describe, expect, it } from 'vitest';
import { pathsToRevalidate, pathsToRevalidateOnDelete } from './revalidate';

describe('pathsToRevalidate', () => {
  it('does nothing for draft-only edits', () => {
    expect(pathsToRevalidate({ slug: 'a', _status: 'draft' }, { slug: 'a', _status: 'draft' })).toEqual([]);
    expect(pathsToRevalidate({ slug: 'a', _status: 'draft' }, undefined)).toEqual([]);
  });
  it('refreshes the page and the sitemap on publish', () => {
    expect(pathsToRevalidate({ slug: 'a', _status: 'published' }, { slug: 'a', _status: 'draft' })).toEqual(['/a', '/sitemap.xml']);
  });
  it('refreshes both old and new URLs on a rename, and the gallery when listed', () => {
    expect(pathsToRevalidate({ slug: 'b', _status: 'published', gallery: { show: true } }, { slug: 'a', _status: 'published' })).toEqual([
      '/b',
      '/a',
      '/prototypes',
      '/sitemap.xml',
    ]);
  });
  it('refreshes on unpublish so the page disappears', () => {
    expect(pathsToRevalidate({ slug: 'a', _status: 'draft' }, { slug: 'a', _status: 'published', gallery: { show: true } })).toEqual(['/a', '/prototypes', '/sitemap.xml']);
  });
});

describe('pathsToRevalidateOnDelete', () => {
  it('only matters for published demos', () => {
    expect(pathsToRevalidateOnDelete({ slug: 'a', _status: 'draft' })).toEqual([]);
    expect(pathsToRevalidateOnDelete({ slug: 'a', _status: 'published', gallery: { show: true } })).toEqual(['/a', '/prototypes', '/sitemap.xml']);
  });
});

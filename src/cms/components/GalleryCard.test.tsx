import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GalleryCard } from './GalleryCard';
import { pickArgs } from '../media/gallery';

const doc = { id: 7, alt: 'Hero', filename: 'hero.png', mimeType: 'image/png', filesize: 2048, width: 800, height: 600, url: 'https://m/hero.png', thumbnailURL: 'https://m/hero-400.webp' };

describe('GalleryCard', () => {
  it('links to the edit page and copies the URL when browsing the Media page', () => {
    const html = renderToStaticMarkup(<GalleryCard doc={doc as never} editBase="/cms/collections/media" onCopy={() => {}} />);
    expect(html).toContain('href="/cms/collections/media/7"');
    expect(html).toContain('Copy URL');
    expect(html).not.toContain('Select');
  });

  it('never navigates when picking: the whole card is a Select button', () => {
    const html = renderToStaticMarkup(<GalleryCard doc={doc as never} editBase="/cms/collections/media" onCopy={() => {}} onPick={() => {}} />);
    expect(html).not.toContain('href=');
    expect(html).toContain('<button type="button" class="bpc-card__pick" aria-label="Select Hero">');
    expect(html).toContain('<img src="https://m/hero-400.webp"');
    expect(html).toContain('>Select<');
    expect(html).not.toContain('Copy URL');
  });
});

describe('pickArgs', () => {
  it('is the payload Payload’s drawers expect from onSelect', () => {
    expect(pickArgs(doc as never)).toEqual({ collectionSlug: 'media', doc, docID: '7' });
  });
});

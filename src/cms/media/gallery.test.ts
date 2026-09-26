import { describe, expect, it } from 'vitest';
import { altFromFilename, createRequestFields, describeFile, formatBytes, galleryQuery, isImage, signedUrlRequestBody } from './gallery';

describe('formatBytes', () => {
  it('picks a sensible unit', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(35559)).toBe('35 KB');
    expect(formatBytes(1689494)).toBe('1.6 MB');
    expect(formatBytes(undefined)).toBe('0 B');
  });
});

describe('describeFile', () => {
  it('shows dimensions, size and type for an image', () => {
    expect(describeFile({ id: 1, filename: 'hero-a1b2c3d4.png', mimeType: 'image/png', filesize: 35559, width: 1200, height: 800 })).toBe(
      '1200×800 · 35 KB · PNG',
    );
  });
  it('omits dimensions for non-images', () => {
    expect(describeFile({ id: 1, filename: 'clip-a1b2c3d4.mp4', mimeType: 'video/mp4', filesize: 5 * 1024 * 1024 })).toBe('5.0 MB · MP4');
  });
  it('isImage', () => {
    expect(isImage({ id: 1, mimeType: 'image/webp' })).toBe(true);
    expect(isImage({ id: 1, mimeType: 'application/pdf' })).toBe(false);
  });
});

describe('galleryQuery', () => {
  it('pages newest-first with a default limit', () => {
    const q = new URLSearchParams(galleryQuery({}));
    expect(q.get('limit')).toBe('40');
    expect(q.get('page')).toBe('1');
    expect(q.get('sort')).toBe('-createdAt');
    expect(q.get('depth')).toBe('0');
    expect([...q.keys()].some((k) => k.startsWith('where'))).toBe(false);
  });
  it('searches alt and filename', () => {
    const q = new URLSearchParams(galleryQuery({ search: ' hero ', page: 2 }));
    expect(q.get('where[or][0][alt][contains]')).toBe('hero');
    expect(q.get('where[or][1][filename][contains]')).toBe('hero');
    expect(q.get('page')).toBe('2');
  });
});

describe('altFromFilename', () => {
  it('turns a filename into readable words', () => {
    expect(altFromFilename('muay-thai_HERO v2.png')).toBe('muay thai HERO v2');
    expect(altFromFilename('IMG_0042.JPG')).toBe('IMG 0042');
  });
});

describe('client upload protocol helpers', () => {
  const file = { name: 'Hero Clean.png', type: 'image/png', size: 120987 };
  it('asks for a signed URL with what the storage plugin expects', () => {
    expect(signedUrlRequestBody(file)).toEqual({ collectionSlug: 'media', filename: 'Hero Clean.png', mimeType: 'image/png', filesize: 120987 });
  });
  it('builds the create request from the signed response, using the sanitized filename and receipt', () => {
    const signed = { url: 'https://r2/put', filename: 'Hero Clean.png', headers: {}, clientUploadContext: { signedReceipt: 'r', prefix: 'media' } };
    const fields = createRequestFields(signed, file, 'hero');
    expect(JSON.parse(fields._payload)).toEqual({ alt: 'hero' });
    expect(JSON.parse(fields.file)).toEqual({
      filename: 'Hero Clean.png',
      mimeType: 'image/png',
      size: 120987,
      clientUploadContext: { signedReceipt: 'r', prefix: 'media' },
    });
  });
});

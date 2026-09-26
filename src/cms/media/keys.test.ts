import { describe, expect, it } from 'vitest';
import {
  ALLOWED_MIME_TYPES,
  MEDIA_PREFIX,
  buildStoredFilename,
  extensionFor,
  isAllowedMime,
  isValidObjectKey,
  maxBytesFor,
  slugifyBasename,
} from './keys';

describe('slugifyBasename', () => {
  it('lowercases, strips the extension and collapses junk to single dashes', () => {
    expect(slugifyBasename('Muay Thai HERO (final) v2.PNG')).toBe('muay-thai-hero-final-v2');
    expect(slugifyBasename('  ..weird__name..jpg')).toBe('weird-name');
    expect(slugifyBasename('日本語.png')).toBe('file');
    expect(slugifyBasename('')).toBe('file');
  });
  it('caps very long names', () => {
    expect(slugifyBasename('a'.repeat(300) + '.jpg').length).toBeLessThanOrEqual(80);
  });
});

describe('extensionFor', () => {
  it('derives the extension from the MIME type, not the user-supplied name', () => {
    expect(extensionFor('image/jpeg', 'photo.PNG')).toBe('jpg');
    expect(extensionFor('image/webp', 'x')).toBe('webp');
    expect(extensionFor('image/svg+xml', 'logo.svg')).toBe('svg');
    expect(extensionFor('video/mp4', 'clip.mov')).toBe('mp4');
    expect(extensionFor('model/gltf-binary', 'ring.glb')).toBe('glb');
    expect(extensionFor('application/pdf', 'doc')).toBe('pdf');
  });
  it('falls back to the filename extension for an unknown but allowed type', () => {
    expect(extensionFor('application/octet-stream', 'ring.glb')).toBe('glb');
  });
});

describe('buildStoredFilename', () => {
  it('is <slug>-<8 hex>.<ext>, so re-uploads never overwrite and URLs can be cached forever', () => {
    const name = buildStoredFilename('Muay Thai Hero.png', 'image/png', () => 'a1b2c3d4');
    expect(name).toBe('muay-thai-hero-a1b2c3d4.png');
  });
  it('generates a fresh random suffix by default', () => {
    const a = buildStoredFilename('x.png', 'image/png');
    const b = buildStoredFilename('x.png', 'image/png');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^x-[0-9a-f]{8}\.png$/);
  });
});

describe('MIME allowlist and size caps', () => {
  it('allows images, video, pdf and 3D models; rejects executables and html', () => {
    for (const m of ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/pdf', 'model/gltf-binary'])
      expect(isAllowedMime(m), m).toBe(true);
    for (const m of ['text/html', 'application/javascript', 'application/x-msdownload', 'application/zip', ''])
      expect(isAllowedMime(m), m).toBe(false);
    expect(ALLOWED_MIME_TYPES).toContain('image/webp');
  });
  it('caps images at 15 MB and video/models at 200 MB', () => {
    expect(maxBytesFor('image/png')).toBe(15 * 1024 * 1024);
    expect(maxBytesFor('video/mp4')).toBe(200 * 1024 * 1024);
    expect(maxBytesFor('model/gltf-binary')).toBe(200 * 1024 * 1024);
    expect(maxBytesFor('application/pdf')).toBe(15 * 1024 * 1024);
  });
});

describe('isValidObjectKey', () => {
  it('accepts our own key shape, including size variants', () => {
    expect(isValidObjectKey(`${MEDIA_PREFIX}/muay-thai-hero-a1b2c3d4.png`)).toBe(true);
    expect(isValidObjectKey(`${MEDIA_PREFIX}/muay-thai-hero-a1b2c3d4-800x600.webp`)).toBe(true);
  });

  it('accepts the per-document UUID folder that browser (client) uploads get', () => {
    const uuid = '94cb048f-7380-41b5-9100-d0b06eecc4e4';
    expect(isValidObjectKey(`${MEDIA_PREFIX}/${uuid}/hero-clean-5e6a733d.png`)).toBe(true);
    expect(isValidObjectKey(`${MEDIA_PREFIX}/${uuid}/hero-clean-5e6a733d-400x240.webp`)).toBe(true);
    // but not arbitrary folders
    expect(isValidObjectKey(`${MEDIA_PREFIX}/anything/hero-clean-5e6a733d.png`)).toBe(false);
    expect(isValidObjectKey(`${MEDIA_PREFIX}/${uuid}/${uuid}/x.png`)).toBe(false);
  });
  it('rejects traversal, absolute paths, backslashes, control chars and empties', () => {
    for (const k of ['', '/', '../x.png', `${MEDIA_PREFIX}/../users`, `${MEDIA_PREFIX}/a\\b.png`, `${MEDIA_PREFIX}/a b.png`, `${MEDIA_PREFIX}/a\u0000.png`, 'other/a.png', `${MEDIA_PREFIX}/`, `${MEDIA_PREFIX}/no-extension`, `${MEDIA_PREFIX}/UPPER.PNG`])
      expect(isValidObjectKey(k), JSON.stringify(k)).toBe(false);
  });
});

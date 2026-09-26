import { describe, expect, it } from 'vitest';
import { mediaFileUrl, mediaHostForRewrite, mediaPublicBase } from './urls';

describe('mediaPublicBase', () => {
  it('reads MEDIA_PUBLIC_URL without a trailing slash', () => {
    expect(mediaPublicBase({ MEDIA_PUBLIC_URL: 'https://media.blueprintcode.ai/' })).toBe('https://media.blueprintcode.ai');
  });
  it('defaults to the local /media route', () => {
    expect(mediaPublicBase({})).toBe('http://localhost:5000/media');
  });
});

describe('mediaFileUrl', () => {
  it('joins base and key', () => {
    expect(mediaFileUrl('media/hero-a1b2c3d4.webp', { MEDIA_PUBLIC_URL: 'https://media.blueprintcode.ai' })).toBe(
      'https://media.blueprintcode.ai/media/hero-a1b2c3d4.webp',
    );
  });
});

describe('mediaHostForRewrite', () => {
  it('is the dedicated host in production', () => {
    expect(mediaHostForRewrite({ MEDIA_PUBLIC_URL: 'https://media.blueprintcode.ai' })).toBe('media.blueprintcode.ai');
  });
  it('is null when media is served under a path (local dev), so no host rewrite is added', () => {
    expect(mediaHostForRewrite({ MEDIA_PUBLIC_URL: 'http://localhost:5000/media' })).toBeNull();
    expect(mediaHostForRewrite({})).toBeNull();
  });
});

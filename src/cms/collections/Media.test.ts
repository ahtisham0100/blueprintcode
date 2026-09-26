import { describe, expect, it } from 'vitest';
import { Media, adminThumbnailUrl, canManageMedia } from './Media';
import { ALLOWED_MIME_TYPES } from '../media/keys';
import { isAdmin } from './Users';

const adminReq = { user: { id: 'a', role: 'admin', collection: 'users' } };
const writerReq = { user: { id: 'w', role: 'writer', collection: 'users' } };
const anon = { user: null };

describe('Media collection', () => {
  const upload = Media.upload as Record<string, unknown>;

  it('is an upload collection stored off-server, limited to the media allowlist', () => {
    expect(Media.slug).toBe('media');
    expect(upload.disableLocalStorage).toBe(true);
    expect(upload.mimeTypes).toEqual(ALLOWED_MIME_TYPES);
  });

  it('produces thumb / medium / large WebP variants and uses the thumb in the admin', () => {
    const sizes = upload.imageSizes as { name: string; width: number; formatOptions?: { format: string } }[];
    expect(sizes.map((s) => [s.name, s.width])).toEqual([
      ['thumb', 400],
      ['medium', 800],
      ['large', 1600],
    ]);
    for (const s of sizes) expect(s.formatOptions?.format).toBe('webp');
    expect(upload.adminThumbnail).toBe(adminThumbnailUrl);
    expect(upload.focalPoint).toBe(true);
  });

  it('builds admin thumbnails from our media URL, never Payload’s /file route', () => {
    const withThumb = { filename: 'hero-a1b2c3d4.png', mimeType: 'image/png', sizes: { thumb: { filename: 'hero-a1b2c3d4-400x267.webp' } } };
    expect(adminThumbnailUrl({ doc: withThumb })).toBe('http://localhost:5000/media/media/hero-a1b2c3d4-400x267.webp');
    // A tiny image gets no resized variant: fall back to the original.
    expect(adminThumbnailUrl({ doc: { filename: 'icon-a1b2c3d4.png', mimeType: 'image/png', sizes: {} } })).toBe(
      'http://localhost:5000/media/media/icon-a1b2c3d4.png',
    );
    // Video / PDF / models: icon, not a broken <img>.
    expect(adminThumbnailUrl({ doc: { filename: 'clip-a1b2c3d4.mp4', mimeType: 'video/mp4' } })).toBeNull();
  });

  it('requires alt text and offers a caption', () => {
    const alt = Media.fields.find((f) => 'name' in f && f.name === 'alt') as { required?: boolean; type: string };
    expect(alt.type).toBe('text');
    expect(alt.required).toBe(true);
    expect(Media.fields.some((f) => 'name' in f && f.name === 'caption')).toBe(true);
  });

  it('lets admins and writers upload/edit, only admins delete, and anyone read', () => {
    expect(canManageMedia({ req: adminReq } as never)).toBe(true);
    expect(canManageMedia({ req: writerReq } as never)).toBe(true);
    expect(canManageMedia({ req: anon } as never)).toBe(false);
    expect(Media.access).toEqual({ create: canManageMedia, update: canManageMedia, delete: isAdmin, read: expect.any(Function) });
    expect((Media.access!.read as (a: unknown) => unknown)({ req: anon })).toBe(true);
  });

  it('renames incoming files to the immutable <slug>-<hash>.<ext> form', () => {
    const hooks = Media.hooks?.beforeOperation ?? [];
    expect(hooks.length).toBeGreaterThan(0);
    const req = { file: { name: 'Muay Thai Hero.png', mimetype: 'image/png', size: 10, data: Buffer.alloc(0) } };
    hooks[0]({ operation: 'create', req } as never);
    expect(req.file.name).toMatch(/^muay-thai-hero-[0-9a-f]{8}\.png$/);
  });

  it('leaves the file alone on operations without an upload', () => {
    const hooks = Media.hooks?.beforeOperation ?? [];
    const req = {} as { file?: unknown };
    expect(() => hooks[0]({ operation: 'update', req } as never)).not.toThrow();
    expect(req.file).toBeUndefined();
  });
});

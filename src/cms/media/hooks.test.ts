import { describe, expect, it, vi } from 'vitest';
import { clientUploadMove, createMoveClientUploadHook, renameUploadHook } from './hooks';

const file = (over: Record<string, unknown> = {}) => ({ name: 'Hero Clean.png', mimetype: 'image/png', size: 10, data: Buffer.alloc(0), ...over });

describe('renameUploadHook', () => {
  it('renames server-side uploads and does not remember an original name', () => {
    const req = { file: file(), context: {} as Record<string, unknown> };
    renameUploadHook({ operation: 'create', req, args: {} } as never);
    expect(req.file.name).toMatch(/^hero-clean-[0-9a-f]{8}\.png$/);
    expect(req.context.clientUploadOriginalName).toBeUndefined();
  });

  it('remembers the browser filename for client uploads, whose object already exists under it', () => {
    const req = { file: file({ clientUploadContext: { prefix: 'media' } }), context: {} as Record<string, unknown> };
    renameUploadHook({ operation: 'create', req, args: {} } as never);
    expect(req.context.clientUploadOriginalName).toBe('Hero Clean.png');
    expect(req.file.name).toMatch(/^hero-clean-[0-9a-f]{8}\.png$/);
  });

  it('rejects files over the cap for their type', () => {
    const req = { file: file({ size: 16 * 1024 * 1024 }), context: {} };
    expect(() => renameUploadHook({ operation: 'create', req, args: {} } as never)).toThrow(/too large/);
  });

  it('leaves operations without a file alone', () => {
    const req = { context: {} } as { file?: unknown; context: object };
    expect(() => renameUploadHook({ operation: 'update', req, args: {} } as never)).not.toThrow();
    expect(req.file).toBeUndefined();
  });
});

describe('clientUploadMove', () => {
  const doc = { filename: 'hero-clean-5e6a733d.png', prefix: 'media', _objectKey: '94cb048f-7380-41b5-9100-d0b06eecc4e4' };

  it('moves from the browser name to the recorded name inside the document folder', () => {
    expect(clientUploadMove(doc, 'Hero Clean.png')).toEqual({
      from: 'media/94cb048f-7380-41b5-9100-d0b06eecc4e4/Hero Clean.png',
      to: 'media/94cb048f-7380-41b5-9100-d0b06eecc4e4/hero-clean-5e6a733d.png',
    });
  });

  it('does nothing for server uploads (no _objectKey) or when names already match', () => {
    expect(clientUploadMove({ ...doc, _objectKey: null }, 'Hero Clean.png')).toBeNull();
    expect(clientUploadMove(doc, undefined)).toBeNull();
    expect(clientUploadMove(doc, 'hero-clean-5e6a733d.png')).toBeNull();
  });
});

describe('createMoveClientUploadHook', () => {
  const doc = { id: 4, filename: 'hero-clean-5e6a733d.png', prefix: 'media', _objectKey: 'u-u-i-d', mimeType: 'image/png' };

  it('moves the object once after create and clears the remembered name', async () => {
    const move = vi.fn(async () => {});
    const hook = createMoveClientUploadHook(move);
    const req = { context: { clientUploadOriginalName: 'Hero Clean.png' } as Record<string, unknown> };
    const out = await hook({ doc, operation: 'create', req } as never);
    expect(out).toBe(doc);
    expect(move).toHaveBeenCalledWith('media/u-u-i-d/Hero Clean.png', 'media/u-u-i-d/hero-clean-5e6a733d.png', 'image/png');
    expect(req.context.clientUploadOriginalName).toBeUndefined();
  });

  it('never touches storage for server uploads or non-write operations', async () => {
    const move = vi.fn(async () => {});
    const hook = createMoveClientUploadHook(move);
    await hook({ doc, operation: 'create', req: { context: {} } } as never);
    await hook({ doc, operation: 'delete', req: { context: { clientUploadOriginalName: 'x.png' } } } as never);
    expect(move).not.toHaveBeenCalled();
  });
});

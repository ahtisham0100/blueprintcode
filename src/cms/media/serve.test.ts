import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { serveMedia, type ObjectStore } from './serve';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4, 5, 6]);

function store(objects: Record<string, { body: Uint8Array; type: string; etag?: string }>): ObjectStore {
  return {
    get: vi.fn(async (key: string, range?: string) => {
      const o = objects[key];
      if (!o) return null;
      let body = o.body;
      let status: 200 | 206 = 200;
      let contentRange: string | undefined;
      if (range) {
        const m = /^bytes=(\d+)-(\d*)$/.exec(range);
        if (m) {
          const start = Number(m[1]);
          const end = m[2] ? Number(m[2]) : o.body.length - 1;
          body = o.body.slice(start, end + 1);
          status = 206;
          contentRange = `bytes ${start}-${end}/${o.body.length}`;
        }
      }
      return { body, status, contentType: o.type, contentLength: body.length, etag: o.etag ?? '"e1"', contentRange };
    }),
  };
}

const req = (key: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(`http://localhost:5000/media/${key}`, init);
const okStore = store({ 'media/hero-a1b2c3d4.png': { body: PNG, type: 'image/png' } });

describe('serveMedia', () => {
  it('streams the object with a one-year immutable cache and the right type', async () => {
    const res = await serveMedia(req('media/hero-a1b2c3d4.png'), 'media/hero-a1b2c3d4.png', okStore);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(res.headers.get('etag')).toBe('"e1"');
    expect(res.headers.get('accept-ranges')).toBe('bytes');
    expect(res.headers.get('content-length')).toBe(String(PNG.length));
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG);
  });

  it('lets pages on other origins (the main site, demos) embed the file', async () => {
    const res = await serveMedia(req('media/hero-a1b2c3d4.png'), 'media/hero-a1b2c3d4.png', okStore);
    expect(res.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('honours Range requests (video seeking)', async () => {
    const res = await serveMedia(req('media/hero-a1b2c3d4.png', { headers: { range: 'bytes=2-4' } }), 'media/hero-a1b2c3d4.png', okStore);
    expect(res.status).toBe(206);
    expect(res.headers.get('content-range')).toBe(`bytes 2-4/${PNG.length}`);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(PNG.slice(2, 5));
  });

  it('answers HEAD with headers only', async () => {
    const res = await serveMedia(req('media/hero-a1b2c3d4.png', { method: 'HEAD' }), 'media/hero-a1b2c3d4.png', okStore);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-length')).toBe(String(PNG.length));
    expect(await res.text()).toBe('');
  });

  it('returns 404 for a missing object, with a short cache so a later upload is not masked', async () => {
    const res = await serveMedia(req('media/nope-a1b2c3d4.png'), 'media/nope-a1b2c3d4.png', okStore);
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
  });

  it('rejects keys that are not ours before touching storage', async () => {
    const s = okStore;
    for (const bad of ['../etc/passwd', 'users/1', 'media/..%2Fx.png', 'media/a b.png']) {
      const res = await serveMedia(req(bad), bad, s);
      expect(res.status, bad).toBe(400);
    }
    expect(s.get).not.toHaveBeenCalledWith(expect.stringContaining('..'), undefined);
  });

  it('sandboxes SVGs so an uploaded SVG cannot run script on our origin', async () => {
    const svgStore = store({ 'media/logo-a1b2c3d4.svg': { body: new TextEncoder().encode('<svg/>'), type: 'image/svg+xml' } });
    const res = await serveMedia(req('media/logo-a1b2c3d4.svg'), 'media/logo-a1b2c3d4.svg', svgStore);
    expect(res.headers.get('content-security-policy')).toBe("sandbox; default-src 'none'; style-src 'unsafe-inline'");
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('never serves a stored object as HTML, whatever its recorded type', async () => {
    const htmlStore = store({ 'media/evil-a1b2c3d4.png': { body: new TextEncoder().encode('<script>'), type: 'text/html' } });
    const res = await serveMedia(req('media/evil-a1b2c3d4.png'), 'media/evil-a1b2c3d4.png', htmlStore);
    expect(res.headers.get('content-type')).toBe('application/octet-stream');
  });
});

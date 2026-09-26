import { afterEach, describe, expect, it, vi } from 'vitest';

// next.config reads MEDIA_PUBLIC_URL at import time, so load it fresh per case.
async function loadRewrites() {
  vi.resetModules();
  const config = (await import('../next.config')).default;
  const rewrites = await config.rewrites!();
  return Array.isArray(rewrites) ? { beforeFiles: [], afterFiles: rewrites } : rewrites;
}

describe('media host rewrite', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('maps every path on the media host to the /media route, before anything else', async () => {
    vi.stubEnv('MEDIA_PUBLIC_URL', 'https://media.blueprintcode.ai');
    const { beforeFiles } = await loadRewrites();
    const rule = beforeFiles!.find((r) => r.destination === '/media/:path*');
    expect(rule).toBeDefined();
    expect(rule!.source).toBe('/:path*');
    expect(rule!.has).toEqual([{ type: 'host', value: 'media.blueprintcode.ai' }]);
  });

  it('adds no host rule when media is served under a path (local dev)', async () => {
    vi.stubEnv('MEDIA_PUBLIC_URL', 'http://localhost:5000/media');
    const { beforeFiles } = await loadRewrites();
    expect((beforeFiles ?? []).some((r) => r.destination === '/media/:path*')).toBe(false);
  });
});

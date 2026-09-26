import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// proxy.ts reads ADMIN_HOST at module load, so re-import it per test.
async function loadProxy() {
  vi.resetModules();
  const mod = await import('./proxy');
  return mod;
}

function req(url: string) {
  const u = new URL(url);
  // NextRequest derives the host from the URL; set the header explicitly too,
  // because that is what the proxy reads on Vercel.
  return new NextRequest(u, { headers: { host: u.host } });
}

describe('proxy', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_HOST', 'admin.blueprintcode.ai, admin.localhost');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rewrites the admin root to /cms with noindex + no-store headers', async () => {
    const { proxy } = await loadProxy();
    const res = proxy(req('https://admin.blueprintcode.ai/'));
    expect(res.headers.get('x-middleware-rewrite')).toBe('https://admin.blueprintcode.ai/cms');
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('passes /cms/* through on the admin host, still with the admin headers', async () => {
    const { proxy } = await loadProxy();
    const res = proxy(req('https://admin.blueprintcode.ai/cms/collections/demos'));
    expect(res.headers.get('x-middleware-rewrite')).toBeNull();
    expect(res.headers.get('x-middleware-next')).toBe('1');
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('301s public paths on the admin host to the main site, keeping path and query', async () => {
    const { proxy } = await loadProxy();
    const res = proxy(req('https://admin.blueprintcode.ai/about?ref=1'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://blueprintcode.ai/about?ref=1');
  });

  it('serves the private robots.txt on the admin host', async () => {
    const { proxy } = await loadProxy();
    const res = proxy(req('https://admin.blueprintcode.ai/robots.txt'));
    expect(res.headers.get('x-middleware-rewrite')).toBe('https://admin.blueprintcode.ai/cms/robots.txt');
  });

  it('works on the local admin host with a port', async () => {
    const { proxy } = await loadProxy();
    const res = proxy(req('http://admin.localhost:5000/'));
    expect(res.headers.get('x-middleware-rewrite')).toBe('http://admin.localhost:5000/cms');
  });

  it('returns 404 for /cms and /api/cms on the main site', async () => {
    const { proxy } = await loadProxy();
    expect(proxy(req('https://blueprintcode.ai/cms')).status).toBe(404);
    expect(proxy(req('https://blueprintcode.ai/api/cms/users')).status).toBe(404);
  });

  it('leaves the main site alone, without admin headers', async () => {
    const { proxy } = await loadProxy();
    for (const path of ['/', '/about', '/admin', '/api/leads']) {
      const res = proxy(req(`https://blueprintcode.ai${path}`));
      expect(res.status).toBe(200);
      expect(res.headers.get('x-middleware-next')).toBe('1');
      expect(res.headers.get('X-Robots-Tag')).toBeNull();
      expect(res.headers.get('Cache-Control')).toBeNull();
    }
  });

  it('treats the admin host as the main site when ADMIN_HOST is unset', async () => {
    vi.stubEnv('ADMIN_HOST', '');
    const { proxy } = await loadProxy();
    expect(proxy(req('https://admin.blueprintcode.ai/cms')).status).toBe(404);
    expect(proxy(req('https://admin.blueprintcode.ai/')).headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('skips static assets and Next internals via the matcher', async () => {
    const { config } = await loadProxy();
    const patterns: string[] = config.matcher;
    // Each matcher entry is a path-to-regexp source; turn it into a regex with
    // the same library Next bundles, for a sanity check on what it excludes.
    // @ts-expect-error -- Next ships this compiled dependency without types.
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const regexes: RegExp[] = patterns.map((p) => pathToRegexp(p));
    const matches = (path: string) => regexes.some((r) => r.test(path));

    expect(matches('/')).toBe(true);
    expect(matches('/cms/login')).toBe(true);
    expect(matches('/api/cms/users')).toBe(true);
    expect(matches('/robots.txt')).toBe(true);
    expect(matches('/about')).toBe(true);

    expect(matches('/_next/static/chunks/main.js')).toBe(false);
    expect(matches('/_next/image?url=x')).toBe(false);
    expect(matches('/favicon.ico')).toBe(false);
    expect(matches('/premium-muay-thai-customiser/assets/hero.png')).toBe(false);
    expect(matches('/site.webmanifest')).toBe(false);
  });
});

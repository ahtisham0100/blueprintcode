import { describe, expect, it } from 'vitest';

// The static-demo rewrite runs before dynamic routes, so it must leave the
// CMS's [[...segments]] route alone while still catching every demo slug.
describe('next.config demo rewrite', () => {
  it('rewrites single-segment demo slugs but never /cms', async () => {
    const config = (await import('../next.config')).default;
    const rewrites = await config.rewrites!();
    const afterFiles = Array.isArray(rewrites) ? [] : rewrites.afterFiles ?? [];
    const demoRule = afterFiles.find((r) => r.destination === '/:slug/index.html');
    expect(demoRule).toBeDefined();

    // @ts-expect-error -- Next ships this compiled dependency without types.
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const re: RegExp = pathToRegexp(demoRule!.source);

    for (const p of ['/woodlawn', '/premium-muay-thai-customiser', '/cms-demo', '/cmsx']) {
      expect(re.test(p), p).toBe(true);
    }
    for (const p of ['/cms', '/cms/login', '/sportswear-demo/product.html', '/']) {
      expect(re.test(p), p).toBe(false);
    }
  });
});

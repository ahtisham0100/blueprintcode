import { describe, expect, it } from 'vitest';

// The static-demo rewrite runs before dynamic routes. It must name exactly
// the static demos that exist, so a slug published from the CMS reaches the
// dynamic [slug] route instead of being rewritten to a missing index.html.
describe('next.config demo rewrite', () => {
  it('rewrites only the existing static demo slugs', async () => {
    const config = (await import('../next.config')).default;
    const rewrites = await config.rewrites!();
    const afterFiles = Array.isArray(rewrites) ? [] : rewrites.afterFiles ?? [];
    const demoRule = afterFiles.find((r) => r.destination === '/:slug/index.html');
    expect(demoRule).toBeDefined();

    // @ts-expect-error -- Next ships this compiled dependency without types.
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const re: RegExp = pathToRegexp(demoRule!.source);

    for (const p of ['/woodlawn', '/premium-muay-thai-customiser', '/stewart-screens-pitch']) {
      expect(re.test(p), p).toBe(true);
    }
    for (const p of ['/cms', '/cms/login', '/sportswear-demo/product.html', '/', '/phase4-demo-test', '/some-new-cms-demo']) {
      expect(re.test(p), p).toBe(false);
    }
  });
});

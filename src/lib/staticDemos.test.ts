import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { listStaticDemoSlugs, staticDemoRewriteSource } from './staticDemos';

function fakePublic(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'bpc-public-'));
  for (const d of ['woodlawn', 'signet-ring-configurator', 'partials', 'media', 'no-index']) mkdirSync(path.join(dir, d));
  writeFileSync(path.join(dir, 'woodlawn', 'index.html'), '<html></html>');
  writeFileSync(path.join(dir, 'signet-ring-configurator', 'index.html'), '<html></html>');
  writeFileSync(path.join(dir, 'partials', 'index.html'), '<html></html>');
  writeFileSync(path.join(dir, 'media', 'index.html'), '<html></html>');
  writeFileSync(path.join(dir, 'robots.txt'), '');
  return dir;
}

describe('listStaticDemoSlugs', () => {
  it('lists folders with an index.html, skipping non-demo folders and files', () => {
    expect(listStaticDemoSlugs(fakePublic())).toEqual(['signet-ring-configurator', 'woodlawn']);
  });
  it('is empty for a missing directory', () => {
    expect(listStaticDemoSlugs(path.join(tmpdir(), 'does-not-exist-bpc'))).toEqual([]);
  });
  it('finds the real demos in this repo', () => {
    const slugs = listStaticDemoSlugs(path.join(process.cwd(), 'public'));
    expect(slugs).toEqual(expect.arrayContaining(['woodlawn', 'premium-muay-thai-customiser']));
    expect(slugs).not.toContain('partials');
    expect(slugs).not.toContain('cms');
  });
});

describe('staticDemoRewriteSource', () => {
  it('matches exactly the listed slugs, nothing else', async () => {
    // @ts-expect-error -- Next ships this compiled dependency without types.
    const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
    const re: RegExp = pathToRegexp(staticDemoRewriteSource(['woodlawn', 'max-kpi-japan'])!);
    expect(re.test('/woodlawn')).toBe(true);
    expect(re.test('/max-kpi-japan')).toBe(true);
    for (const p of ['/cms', '/phase4-demo-test', '/woodlawn/x', '/woodlawnx', '/', '/about']) expect(re.test(p), p).toBe(false);
  });
  it('is null with no static demos, so no rewrite is registered', () => {
    expect(staticDemoRewriteSource([])).toBeNull();
  });
});

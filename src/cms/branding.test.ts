import { describe, expect, it } from 'vitest';
import { CMS_BRAND } from './branding';

describe('CMS branding', () => {
  it('uses the public site wordmark and a dark-only theme', () => {
    expect(CMS_BRAND.name).toBe('BLUEPRINT CODE AI');
    expect(CMS_BRAND.theme).toBe('dark');
    expect(CMS_BRAND.titleSuffix).toMatch(/BPC CMS/);
  });

  it('points the icon at a file that exists in public/', async () => {
    const { existsSync } = await import('node:fs');
    expect(CMS_BRAND.iconSrc.startsWith('/')).toBe(true);
    expect(existsSync(`public${CMS_BRAND.iconSrc}`)).toBe(true);
  });
});

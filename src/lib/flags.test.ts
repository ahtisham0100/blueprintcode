import { afterEach, describe, expect, it, vi } from 'vitest';
import { isBlogPublic, isCmsPublic } from './flags';

describe('isCmsPublic', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is off by default so nothing from the new CMS reaches the public site', () => {
    vi.stubEnv('CMS_PUBLIC', '');
    expect(isCmsPublic()).toBe(false);
    vi.stubEnv('CMS_PUBLIC', 'off');
    expect(isCmsPublic()).toBe(false);
    vi.stubEnv('CMS_PUBLIC', 'false');
    expect(isCmsPublic()).toBe(false);
    vi.stubEnv('CMS_PUBLIC', 'yes please');
    expect(isCmsPublic()).toBe(false);
  });

  it('turns on with on / true / 1, in any case', () => {
    for (const v of ['on', 'ON', 'true', 'True', '1', ' on ']) {
      vi.stubEnv('CMS_PUBLIC', v);
      expect(isCmsPublic()).toBe(true);
    }
  });
});

describe('isBlogPublic', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is off by default and independent of CMS_PUBLIC', () => {
    vi.stubEnv('BLOG_PUBLIC', '');
    vi.stubEnv('CMS_PUBLIC', 'on');
    expect(isBlogPublic()).toBe(false);
    vi.stubEnv('BLOG_PUBLIC', 'off');
    expect(isBlogPublic()).toBe(false);
  });

  it('turns on with the same values as CMS_PUBLIC, without needing it', () => {
    vi.stubEnv('CMS_PUBLIC', '');
    for (const v of ['on', 'TRUE', '1']) {
      vi.stubEnv('BLOG_PUBLIC', v);
      expect(isBlogPublic()).toBe(true);
    }
  });
});

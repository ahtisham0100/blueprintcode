import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCmsPublic } from './flags';

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

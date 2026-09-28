import { describe, expect, it } from 'vitest';
import { redirectForSlugChange, validateRedirectPath } from './redirects';

describe('redirectForSlugChange', () => {
  it('plans a permanent redirect from the old slug to the new one', () => {
    expect(redirectForSlugChange({ slug: 'signet-ring-configurator-demo-3' }, { slug: 'signet-ring-configurator' })).toEqual({
      from: '/signet-ring-configurator-demo-3',
      to: '/signet-ring-configurator',
      permanent: true,
    });
  });
  it('does nothing on create, unchanged slug, or missing values', () => {
    expect(redirectForSlugChange(undefined, { slug: 'a' })).toBeNull();
    expect(redirectForSlugChange({ slug: 'a' }, { slug: 'a' })).toBeNull();
    expect(redirectForSlugChange({ slug: 'a' }, { slug: '' })).toBeNull();
  });
});

describe('validateRedirectPath', () => {
  it('accepts site paths and, where allowed, absolute URLs', () => {
    expect(validateRedirectPath('/old-demo')).toBeNull();
    expect(validateRedirectPath('https://example.com/x', { allowAbsolute: true })).toBeNull();
  });
  it('rejects the rest', () => {
    expect(validateRedirectPath('old-demo')).toMatch(/start with/);
    expect(validateRedirectPath('https://example.com/x')).toMatch(/start with/);
    expect(validateRedirectPath('//evil.example')).toMatch(/valid/);
    expect(validateRedirectPath('/a b')).toMatch(/spaces/);
    expect(validateRedirectPath('')).toMatch(/Required/);
  });
});

import { describe, expect, it } from 'vitest';
import { createLoginToken, hashLoginToken, looksLikeLoginToken, normaliseEmail } from './loginToken';

describe('login tokens', () => {
  it('are random, url-safe and stored only as a hash', () => {
    const a = createLoginToken();
    const b = createLoginToken();
    expect(a.token).not.toBe(b.token);
    expect(looksLikeLoginToken(a.token)).toBe(true);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.hash).toBe(hashLoginToken(a.token));
    expect(a.hash).not.toContain(a.token);
  });

  it('rejects anything that is not one of ours', () => {
    for (const t of ['', 'short', 'a'.repeat(44), 'a'.repeat(42) + '=', null, 42]) expect(looksLikeLoginToken(t)).toBe(false);
  });
});

describe('normaliseEmail', () => {
  it('lower-cases and trims', () => {
    expect(normaliseEmail('  Jane.Doe@Example.CO.UK ')).toBe('jane.doe@example.co.uk');
    expect(normaliseEmail('a+tag@gmail.com')).toBe('a+tag@gmail.com');
  });

  it('refuses non-addresses and header-injection attempts', () => {
    for (const e of ['', 'nope', 'a@b', 'a b@c.com', 'a@b.com\nBcc: x@y.com', '"a"@b.com', 'a@b.com, c@d.com', 'x'.repeat(250) + '@b.com', 12]) {
      expect(normaliseEmail(e)).toBeNull();
    }
  });
});

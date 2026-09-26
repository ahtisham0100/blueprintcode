import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('admin host robots.txt', () => {
  it('disallows everything and carries no sitemap', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/^text\/plain/);
    const body = await res.text();
    expect(body).toMatch(/User-agent:\s*\*/i);
    expect(body).toMatch(/Disallow:\s*\/\s*$/im);
    expect(body).not.toMatch(/^Allow:/im);
    expect(body).not.toMatch(/Sitemap:/i);
  });
});

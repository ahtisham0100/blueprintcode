import { describe, expect, it, vi } from 'vitest';
import { INDEXNOW_ENDPOINT, INDEXNOW_HOST, INDEXNOW_KEY, submitIndexNow } from '../../../scripts/lib/indexnow.mjs';
import { readFileSync } from 'node:fs';

describe('submitIndexNow', () => {
  it('posts the deduplicated, on-host URLs with the key', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 202 }));
    const out = await submitIndexNow(['https://blueprintcode.ai/a', 'https://blueprintcode.ai/a', 'https://evil.example/x', 'http://blueprintcode.ai/insecure'], fetchFn as never);
    expect(out).toEqual({ ok: true, status: 202, submitted: 1 });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(INDEXNOW_ENDPOINT);
    expect(JSON.parse(init.body as string)).toEqual({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
      urlList: ['https://blueprintcode.ai/a'],
    });
  });

  it('does not call out when nothing is submittable, and reports non-2xx without throwing', async () => {
    const fetchFn = vi.fn(async () => new Response('', { status: 403 }));
    expect(await submitIndexNow([], fetchFn as never)).toEqual({ ok: true, status: 0, submitted: 0 });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(await submitIndexNow(['https://blueprintcode.ai/a'], fetchFn as never)).toEqual({ ok: false, status: 403, submitted: 1 });
  });

  it('matches the deployed key file', () => {
    expect(readFileSync(`public/${INDEXNOW_KEY}.txt`, 'utf8').trim()).toBe(INDEXNOW_KEY);
  });
});

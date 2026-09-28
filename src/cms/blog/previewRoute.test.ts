import { describe, expect, it, vi } from 'vitest';
import { PREVIEW_HEADERS, resolvePreview } from './previewRoute';
import { signPostPreviewToken } from './preview';
import { signPreviewToken } from '../demos/preview';

const SECRET = 'test-secret-that-is-long-enough-for-hs256-0123456789';
const NOW = 1_800_000_000;

describe('resolvePreview', () => {
  const load = vi.fn(async (id: string) => (id === '5' ? { id: 5, title: 'Draft' } : null));

  it('is forbidden without a valid token for that post', async () => {
    expect(await resolvePreview({ id: '5', token: '', secret: SECRET, load, now: NOW })).toEqual({ kind: 'forbidden' });
    expect(await resolvePreview({ id: '5', token: 'junk', secret: SECRET, load, now: NOW })).toEqual({ kind: 'forbidden' });
    const other = await signPostPreviewToken(6, SECRET, { now: NOW });
    expect(await resolvePreview({ id: '5', token: other, secret: SECRET, load, now: NOW })).toEqual({ kind: 'forbidden' });
    const demo = await signPreviewToken(5, SECRET, { now: NOW });
    expect(await resolvePreview({ id: '5', token: demo, secret: SECRET, load, now: NOW })).toEqual({ kind: 'forbidden' });
    expect(load).not.toHaveBeenCalled();
  });

  it('is missing for a valid token whose post no longer exists, or a non-numeric id', async () => {
    const t = await signPostPreviewToken(9, SECRET, { now: NOW });
    expect(await resolvePreview({ id: '9', token: t, secret: SECRET, load, now: NOW })).toEqual({ kind: 'missing' });
    expect(await resolvePreview({ id: 'abc', token: t, secret: SECRET, load, now: NOW })).toEqual({ kind: 'missing' });
  });

  it('returns the draft for a valid, unexpired token', async () => {
    const t = await signPostPreviewToken(5, SECRET, { now: NOW });
    expect(await resolvePreview({ id: '5', token: t, secret: SECRET, load, now: NOW + 60 })).toEqual({ kind: 'ok', post: { id: 5, title: 'Draft' } });
    expect(await resolvePreview({ id: '5', token: t, secret: SECRET, load, now: NOW + 31 * 60 })).toEqual({ kind: 'forbidden' });
  });

  it('declares noindex + no-store headers for the route', () => {
    expect(PREVIEW_HEADERS).toEqual({ 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' });
  });
});

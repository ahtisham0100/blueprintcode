import { describe, expect, it } from 'vitest';
import { POST_PREVIEW_BASE, postPreviewPath, signPostPreviewToken, verifyPostPreviewToken } from './preview';
import { PREVIEW_TTL_SECONDS, signPreviewToken, verifyPreviewToken } from '../demos/preview';
import { signSession } from '../auth/session';

const SECRET = 'test-secret-that-is-long-enough-for-hs256-0123456789';
const NOW = 1_800_000_000;

describe('post preview tokens', () => {
  it('verify for the post they were issued for, within the TTL', async () => {
    const t = await signPostPreviewToken(9, SECRET, { now: NOW });
    expect(await verifyPostPreviewToken(t, 9, SECRET, { now: NOW + 60 })).toBe(true);
    expect(await verifyPostPreviewToken(t, '9', SECRET, { now: NOW + PREVIEW_TTL_SECONDS - 1 })).toBe(true);
    expect(await verifyPostPreviewToken(t, 9, SECRET, { now: NOW + PREVIEW_TTL_SECONDS + 1 })).toBe(false);
    expect(await verifyPostPreviewToken(t, 10, SECRET, { now: NOW })).toBe(false);
    expect(await verifyPostPreviewToken('', 9, SECRET, { now: NOW })).toBe(false);
  });

  it('are a separate audience from demo previews and sessions', async () => {
    const post = await signPostPreviewToken(9, SECRET, { now: NOW });
    const demo = await signPreviewToken(9, SECRET, { now: NOW });
    const session = await signSession({ userId: '9', email: 'a@blueprintcode.ai' }, SECRET, { now: NOW });
    // A demo token must not open post 9's preview, nor a post token demo 9's.
    expect(await verifyPostPreviewToken(demo, 9, SECRET, { now: NOW })).toBe(false);
    expect(await verifyPreviewToken(post, 9, SECRET, { now: NOW })).toBe(false);
    expect(await verifyPostPreviewToken(session, 9, SECRET, { now: NOW })).toBe(false);
    // The demo path is unchanged by the generalisation.
    expect(await verifyPreviewToken(demo, 9, SECRET, { now: NOW })).toBe(true);
  });

  it('build the /blog-preview path with the token encoded', () => {
    expect(POST_PREVIEW_BASE).toBe('/blog-preview');
    expect(postPreviewPath(7, 'a.b+c')).toBe('/blog-preview/7?token=a.b%2Bc');
  });
});

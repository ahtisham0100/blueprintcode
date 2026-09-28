import { describe, expect, it } from 'vitest';
import { PREVIEW_TTL_SECONDS, previewPath, signPreviewToken, verifyPreviewToken } from './preview';
import { signSession } from '../auth/session';

const SECRET = 'test-secret-that-is-long-enough-for-hs256-0123456789';
const NOW = 1_800_000_000;

describe('preview tokens', () => {
  it('verifies for the demo it was issued for, within 30 minutes', async () => {
    const t = await signPreviewToken(42, SECRET, { now: NOW });
    expect(await verifyPreviewToken(t, 42, SECRET, { now: NOW + 60 })).toBe(true);
    expect(await verifyPreviewToken(t, '42', SECRET, { now: NOW + PREVIEW_TTL_SECONDS - 1 })).toBe(true);
    expect(await verifyPreviewToken(t, 42, SECRET, { now: NOW + PREVIEW_TTL_SECONDS + 1 })).toBe(false);
  });

  it('is bound to one demo and one secret', async () => {
    const t = await signPreviewToken(42, SECRET, { now: NOW });
    expect(await verifyPreviewToken(t, 43, SECRET, { now: NOW })).toBe(false);
    expect(await verifyPreviewToken(t, 42, 'another-secret-another-secret-another', { now: NOW })).toBe(false);
    expect(await verifyPreviewToken('garbage', 42, SECRET, { now: NOW })).toBe(false);
    expect(await verifyPreviewToken('', 42, SECRET, { now: NOW })).toBe(false);
  });

  it('cannot be swapped for a session token (different audience)', async () => {
    const session = await signSession({ userId: '42', email: 'a@blueprintcode.ai' }, SECRET, { now: NOW });
    expect(await verifyPreviewToken(session, 42, SECRET, { now: NOW })).toBe(false);
  });

  it('builds the preview path with the token encoded', () => {
    expect(previewPath(7, 'a.b+c')).toBe('/demo-preview/7?token=a.b%2Bc');
  });
});

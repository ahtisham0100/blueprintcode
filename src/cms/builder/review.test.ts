import { describe, expect, it } from 'vitest';
import { verifyReviewLink } from '@/builder/auth/session';
import { decideReview } from './review';

const SECRET = 'r'.repeat(40);
const base = { secret: SECRET, siteOrigin: 'https://blueprintcode.ai', cmsOrigin: 'https://admin.blueprintcode.ai', projectExists: async (id: string) => id === 'BP-AAAAAAAAAA' };

describe('decideReview', () => {
  it('sends a signed-out visitor to the CMS login', async () => {
    expect(await decideReview({ ...base, user: null, id: 'BP-AAAAAAAAAA' })).toEqual({ kind: 'login', to: 'https://admin.blueprintcode.ai/cms/login' });
  });

  it('refuses writers', async () => {
    expect(await decideReview({ ...base, user: { email: 'w@blueprintcode.ai', role: 'writer' }, id: 'BP-AAAAAAAAAA' })).toEqual({ kind: 'forbidden' });
  });

  it('404s unknown and malformed ids', async () => {
    const user = { email: 'j@blueprintcode.ai', role: 'admin' };
    for (const id of ['BP-BBBBBBBBBB', '../x', undefined, 'bp-aaaaaaaaaa']) expect((await decideReview({ ...base, user, id })).kind).toBe('notFound');
  });

  it('hands an admin a short link on the PUBLIC site for that one project', async () => {
    const d = await decideReview({ ...base, user: { email: 'j@blueprintcode.ai', role: 'admin' }, id: 'BP-AAAAAAAAAA' });
    if (d.kind !== 'redirect') throw new Error(d.kind);
    const url = new URL(d.to);
    expect(url.origin + url.pathname).toBe('https://blueprintcode.ai/builder/review');
    expect(await verifyReviewLink(url.searchParams.get('token'), SECRET)).toEqual({ projectId: 'BP-AAAAAAAAAA', email: 'j@blueprintcode.ai' });
  });
});

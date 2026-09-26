import { describe, expect, it } from 'vitest';
import { authorizeGoogleClaims, type AllowlistedUser } from './authorize';

const admin: AllowlistedUser = { id: 'u1', email: 'ahtisham@blueprintcode.ai', role: 'admin', active: true };
const claims = { sub: '9', email: 'ahtisham@blueprintcode.ai', emailVerified: true, hd: 'blueprintcode.ai', name: 'A' };
const opts = (users: AllowlistedUser[]) => ({
  allowedDomain: 'blueprintcode.ai',
  findUserByEmail: async (email: string) => users.find((u) => u.email === email) ?? null,
});

describe('authorizeGoogleClaims', () => {
  it('admits a verified, in-domain, allowlisted, active user', async () => {
    await expect(authorizeGoogleClaims(claims, opts([admin]))).resolves.toEqual({ ok: true, user: admin });
  });

  it('rejects an unverified email even if everything else matches', async () => {
    await expect(authorizeGoogleClaims({ ...claims, emailVerified: false }, opts([admin]))).resolves.toEqual({
      ok: false,
      reason: 'email_not_verified',
    });
  });

  it('rejects a token from outside the Workspace domain (hd claim), whatever the email says', async () => {
    await expect(authorizeGoogleClaims({ ...claims, hd: undefined }, opts([admin]))).resolves.toEqual({
      ok: false,
      reason: 'wrong_domain',
    });
    await expect(authorizeGoogleClaims({ ...claims, hd: 'evil.example' }, opts([admin]))).resolves.toEqual({
      ok: false,
      reason: 'wrong_domain',
    });
  });

  it('rejects an in-domain account that is not on the allowlist', async () => {
    await expect(authorizeGoogleClaims({ ...claims, email: 'sales@blueprintcode.ai' }, opts([admin]))).resolves.toEqual({
      ok: false,
      reason: 'not_allowlisted',
    });
  });

  it('rejects a deactivated user', async () => {
    await expect(authorizeGoogleClaims(claims, opts([{ ...admin, active: false }]))).resolves.toEqual({
      ok: false,
      reason: 'inactive',
    });
  });

  it('matches the email case-insensitively and trimmed', async () => {
    await expect(authorizeGoogleClaims({ ...claims, email: '  Ahtisham@BluePrintCode.ai ' }, opts([admin]))).resolves.toEqual({
      ok: true,
      user: admin,
    });
  });

  it('compares the domain case-insensitively', async () => {
    await expect(authorizeGoogleClaims({ ...claims, hd: 'BluePrintCode.AI' }, opts([admin]))).resolves.toMatchObject({ ok: true });
  });
});

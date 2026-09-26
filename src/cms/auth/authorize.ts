/* Who gets in. Google only proves identity; this decides access:
     1. the email must be verified by Google,
     2. the token's hd claim must be our Workspace domain (an outside Gmail
        account never gets past here, whatever its address looks like),
     3. the address must be on the allowlist (the users collection),
     4. and that user must be active.
   Pure: the allowlist lookup is injected. */

import type { GoogleClaims } from './google';

export type AllowlistedUser = {
  id: string | number;
  email: string;
  role: 'admin' | 'writer';
  active: boolean;
};

export type DenyReason = 'email_not_verified' | 'wrong_domain' | 'not_allowlisted' | 'inactive';

export type AuthorizeResult = { ok: true; user: AllowlistedUser } | { ok: false; reason: DenyReason };

export async function authorizeGoogleClaims(
  claims: GoogleClaims,
  opts: { allowedDomain: string; findUserByEmail: (email: string) => Promise<AllowlistedUser | null> },
): Promise<AuthorizeResult> {
  if (!claims.emailVerified) return { ok: false, reason: 'email_not_verified' };
  if ((claims.hd ?? '').toLowerCase() !== opts.allowedDomain.toLowerCase()) return { ok: false, reason: 'wrong_domain' };

  const user = await opts.findUserByEmail(claims.email.trim().toLowerCase());
  if (!user) return { ok: false, reason: 'not_allowlisted' };
  if (!user.active) return { ok: false, reason: 'inactive' };
  return { ok: true, user };
}

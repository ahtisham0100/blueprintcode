/* Real wiring for the OAuth handlers: env vars, Google over the network, and
   the users collection as the allowlist. Nothing here is unit-tested; the
   logic it feeds is (handlers.test.ts, google.test.ts, authorize.test.ts). */

import config from '@payload-config';
import { getPayload } from 'payload';
import type { AllowlistedUser } from './authorize';
import { exchangeCodeForIdToken, verifyGoogleIdToken } from './google';
import type { OAuthDeps } from './handlers';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export function oauthDeps(): OAuthDeps {
  const serverUrl = required('CMS_SERVER_URL').replace(/\/$/, '');
  return {
    clientId: required('GOOGLE_CLIENT_ID'),
    clientSecret: required('GOOGLE_CLIENT_SECRET'),
    serverUrl,
    allowedDomain: process.env.CMS_ALLOWED_DOMAIN ?? 'blueprintcode.ai',
    secret: required('PAYLOAD_SECRET'),
    secure: serverUrl.startsWith('https://'),
    exchangeCode: (args) => exchangeCodeForIdToken(args),
    verifyIdToken: (idToken, opts) => verifyGoogleIdToken(idToken, opts),
    findUserByEmail: async (email): Promise<AllowlistedUser | null> => {
      const payload = await getPayload({ config });
      const { docs } = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const u = docs[0] as { id: string | number; email: string; role: 'admin' | 'writer'; active?: boolean } | undefined;
      return u ? { id: u.id, email: u.email, role: u.role, active: u.active !== false } : null;
    },
  };
}

/* Payload auth strategy: turns our session cookie into a Payload user on
   every request (admin UI and REST alike). Re-reads the user each time, so
   deactivating or deleting someone locks them out immediately, not when
   their cookie expires. */

import type { AuthStrategy } from 'payload';
import { readSessionCookie, sessionSecret, verifySession } from './session';

export const googleSessionStrategy: AuthStrategy = {
  name: 'google-session',
  authenticate: async ({ headers, payload }) => {
    const token = readSessionCookie(headers);
    if (!token) return { user: null };

    // Not payload.secret — see sessionSecret().
    const session = await verifySession(token, sessionSecret());
    if (!session) return { user: null };

    try {
      const user = (await payload.findByID({
        collection: 'users',
        id: session.userId,
        depth: 0,
        overrideAccess: true,
      })) as { active?: boolean } | null;
      if (!user || !user.active) return { user: null };
      return { user: { collection: 'users', ...user } as never };
    } catch {
      return { user: null };
    }
  },
};

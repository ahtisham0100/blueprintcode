/* CMS users = the allowlist. Nobody can sign in unless an admin has created
   their row here; Google only proves who they are (see auth/authorize.ts).
   No passwords: the local strategy is off and the only strategy is our
   Google-backed session. */

import type { Access, CollectionConfig } from 'payload';
import { googleSessionStrategy } from '../auth/strategy';
import { SESSION_TTL_SECONDS } from '../auth/session';

type CmsUser = { id: string | number; role?: string; active?: boolean };

export const isAdmin: Access = ({ req }) => (req.user as CmsUser | null)?.role === 'admin';

export const isAdminOrSelf: Access = ({ req }) => {
  const user = req.user as CmsUser | null;
  if (!user) return false;
  if (user.role === 'admin') return true;
  return { id: { equals: user.id } };
};

const canUseAdminPanel = ({ req }: { req: { user: unknown } }): boolean => {
  const user = req.user as CmsUser | null;
  return Boolean(user && user.active);
};

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'People',
    defaultColumns: ['email', 'name', 'role', 'active'],
  },
  auth: {
    disableLocalStrategy: true,
    strategies: [googleSessionStrategy],
    tokenExpiration: SESSION_TTL_SECONDS,
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdmin,
    admin: canUseAdminPanel,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: { description: 'Must be a Google Workspace account on the company domain.' },
    },
    { name: 'name', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'writer',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Writer', value: 'writer' },
      ],
      admin: { description: 'Admins manage users, demos and campaigns. Writers get blog posts and media.' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Untick to revoke access immediately.' },
    },
  ],
};

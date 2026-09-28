/* Site redirects, editable by admins and written automatically when a demo's
   or post's slug changes. Served by the public [slug] route (Phase 4 step 3)
   and the blog post route; the hardcoded ones in next.config.ts stay until
   switch-over. */

import type { CollectionConfig } from 'payload';
import { validateRedirectPath } from '../demos/redirects';
import { hiddenFromWriters, isAdmin } from './Users';

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'permanent', 'updatedAt'],
    group: 'Content',
    description: 'Old URL → new URL. Created automatically when a demo’s or post’s slug changes.',
    hidden: hiddenFromWriters,
  },
  access: { create: isAdmin, read: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (v: unknown) => validateRedirectPath(v) ?? true,
      admin: { description: 'Site path, e.g. /old-demo or /blog/old-post' },
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      validate: (v: unknown) => validateRedirectPath(v, { allowAbsolute: true }) ?? true,
      admin: { description: 'Site path (/new-demo) or full URL' },
    },
    { name: 'permanent', type: 'checkbox', defaultValue: true, admin: { description: '301 (search engines transfer ranking). Untick for a temporary 302.' } },
    { name: 'note', type: 'text', admin: { description: 'Why this exists (optional)' } },
  ],
};

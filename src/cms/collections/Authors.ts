/* Blog authors: the byline and author box on each post, and the schema.org
   Person in its structured data. Admins and writers manage them. */

import type { CollectionAfterChangeHook, CollectionConfig } from 'payload';
import { BLOG_LISTING_TARGETS } from '../blog/revalidate';
import { slugify, validatePostSlug } from '../blog/slug';
import { revalidateTargets } from '../revalidate';
import { canWrite, isAdmin } from './Users';

/** An edited author changes the byline on every post: refresh them all. */
export const revalidatePostsOnAuthorChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await revalidateTargets(BLOG_LISTING_TARGETS, req.payload.logger);
  return doc;
};

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'updatedAt'],
    group: 'Content',
    description: 'Who writes the posts. Shown in the byline and the author box, and sent to search engines as the article’s author.',
  },
  access: { create: canWrite, read: () => true, update: canWrite, delete: isAdmin },
  hooks: { afterChange: [revalidatePostsOnAuthorChange] },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (v: unknown) => validatePostSlug(v) ?? true,
      hooks: {
        beforeValidate: [({ value, siblingData }) => (value ? value : siblingData?.name ? slugify(String(siblingData.name)) : value)],
      },
      admin: { description: 'Used as the anchor on the About page (about#<slug>) and as a stable id.' },
    },
    { name: 'title', type: 'text', admin: { description: 'Job title, e.g. "Founder & Solutions Architect".' } },
    { name: 'bio', type: 'textarea', admin: { description: 'Two or three sentences for the author box.' } },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    {
      name: 'links',
      type: 'array',
      admin: { description: 'Public profiles (LinkedIn, personal site). Also sent as schema.org sameAs.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
};

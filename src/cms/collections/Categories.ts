/* Blog categories: /blog/category/<slug>. Admins and writers manage them;
   the public reads them (names appear on cards and post pages). */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload';
import { BLOG_LISTING_TARGETS } from '../blog/revalidate';
import { slugify, validatePostSlug } from '../blog/slug';
import { revalidateTargets } from '../revalidate';
import { canWrite, isAdmin } from './Users';

/** A renamed category changes labels on every listing and post page. */
export const revalidateBlogOnChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  const slugs = [doc?.slug, previousDoc?.slug].filter((s): s is string => Boolean(s));
  await revalidateTargets([...slugs.map((s) => ({ path: `/blog/category/${s}` })), ...BLOG_LISTING_TARGETS], req.payload.logger);
  return doc;
};

export const revalidateBlogOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await revalidateTargets([...(doc?.slug ? [{ path: `/blog/category/${doc.slug}` }] : []), ...BLOG_LISTING_TARGETS], req.payload.logger);
  return doc;
};

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Content',
    description: 'Blog categories. Each one lists its posts at blueprintcode.ai/blog/category/<slug>.',
  },
  access: { create: canWrite, read: () => true, update: canWrite, delete: isAdmin },
  hooks: { afterChange: [revalidateBlogOnChange], afterDelete: [revalidateBlogOnDelete] },
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
      admin: { description: 'The URL: blueprintcode.ai/blog/category/<slug>. Lowercase letters, numbers, hyphens.' },
    },
    { name: 'description', type: 'textarea', admin: { description: 'One or two lines shown at the top of the category page and used as its meta description.' } },
  ],
};

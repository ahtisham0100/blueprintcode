/* Demos: pasted HTML documents published at /<slug> with generated SEO tags
   and the site chrome. Admin-only — pasting HTML is deploying code. Drafts
   and versions on; publishing is what makes a demo public (Phase 4 step 3). */

import type { Access, CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload';
import { sessionSecret } from '../auth/session';
import { validateDemoHtml } from '../demos/html';
import { previewPath, signPreviewToken } from '../demos/preview';
import { redirectForSlugChange } from '../demos/redirects';
import { pathsToRevalidate, pathsToRevalidateOnDelete, urlsToPing } from '../demos/revalidate';
import { submitIndexNow } from '../../../scripts/lib/indexnow.mjs';
import { slugify, validateDemoSlug } from '../demos/slug';
import { seoGroupField, seoPreviewField } from '../fields/seo';
import { isCmsPublic } from '../../lib/flags';
import { publicSiteOrigin } from '../settings';
import { hiddenFromWriters, isAdmin } from './Users';

/** Ask Next to drop cached copies of the public paths a change affects.
 *  Imported lazily: revalidatePath only exists inside the Next server; the
 *  Payload CLI (migrations) loads this config too. */
async function revalidate(paths: string[], logger: { warn: (o: unknown) => void }) {
  if (!paths.length) return;
  try {
    const { revalidatePath } = await import('next/cache');
    for (const p of paths) revalidatePath(p);
  } catch (err) {
    logger.warn({ msg: 'demos: could not revalidate', paths, err: String(err) });
  }
}

export const revalidateOnChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  await revalidate(pathsToRevalidate(doc, previousDoc), req.payload.logger);
  return doc;
};

/** Tell IndexNow (Bing & co.) about a published/renamed demo — production
 *  only, since engines fetch the URL and the key file from the live site. */
export const pingSearchEnginesOnPublish: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (process.env.VERCEL_ENV !== 'production') return doc;
  const urls = urlsToPing(doc, previousDoc, 'https://blueprintcode.ai');
  if (!urls.length) return doc;
  try {
    const r = await submitIndexNow(urls);
    req.payload.logger.info({ msg: 'demos: IndexNow', urls, status: r.status });
  } catch (err) {
    req.payload.logger.warn({ msg: 'demos: IndexNow failed', urls, err: String(err) });
  }
  return doc;
};

export const revalidateOnDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await revalidate(pathsToRevalidateOnDelete(doc), req.payload.logger);
  return doc;
};

/** Published demos are public (the site reads them); drafts are admin-only. */
export const readPublishedOrAdmin: Access = ({ req }) => {
  if ((req.user as { role?: string } | null)?.role === 'admin') return true;
  return { _status: { equals: 'published' } };
};

/** afterChange: keep the old URL alive when a published demo's slug changes. */
export const keepOldUrl: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update') return doc;
  const plan = redirectForSlugChange(previousDoc, doc);
  if (!plan || (doc as { _status?: string })._status !== 'published') return doc;
  const existing = await req.payload.find({ collection: 'redirects', where: { from: { equals: plan.from } }, limit: 1, overrideAccess: true });
  if (existing.totalDocs === 0) {
    await req.payload.create({
      collection: 'redirects',
      data: { from: plan.from, to: plan.to, permanent: true, note: `Demo slug renamed (${doc.id})` },
      overrideAccess: true,
    });
  }
  return doc;
};

export const Demos: CollectionConfig = {
  slug: 'demos',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    description: 'Interactive demos published at blueprintcode.ai/<slug>.',
    hidden: hiddenFromWriters,
    components: {
      // "View live" next to Preview once the demo has a published version.
      edit: {
        beforeDocumentControls: [
          { path: '/cms/components/LiveLink.client#LiveLink', clientProps: { siteUrl: publicSiteOrigin(), pathPrefix: '/', sectionPublic: isCmsPublic(), flagName: 'CMS_PUBLIC' } },
        ],
      },
    },
    // Preview opens the latest draft on the public host with a 30-minute token.
    preview: async (doc) => `${publicSiteOrigin()}${previewPath(String(doc.id), await signPreviewToken(String(doc.id), sessionSecret()))}`,
  },
  access: { create: isAdmin, read: readPublishedOrAdmin, update: isAdmin, delete: isAdmin },
  versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, maxPerDoc: 25 },
  hooks: { afterChange: [keepOldUrl, revalidateOnChange, pingSearchEnginesOnPublish], afterDelete: [revalidateOnDelete] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true, admin: { description: 'Shown as the browser tab title and in search results.' } },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              validate: (v: unknown) => validateDemoSlug(v) ?? true,
              hooks: {
                beforeValidate: [({ value, siblingData }) => (value ? value : siblingData?.title ? slugify(String(siblingData.title)) : value)],
              },
              admin: { description: 'The URL: blueprintcode.ai/<slug>. Lowercase letters, numbers, hyphens. Renaming a published demo adds a redirect.' },
            },
            { name: 'label', type: 'text', admin: { description: 'Short label in the site header next to the wordmark (defaults to the title).' } },
            {
              name: 'html',
              type: 'code',
              required: true,
              validate: (v: unknown) => validateDemoHtml(v) ?? true,
              admin: { language: 'html', description: 'The complete HTML document. Reference images and files from the Media library by URL.' },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoPreviewField({ pathPrefix: '/', noun: 'demo' }), seoGroupField()],
        },
        {
          label: 'Gallery',
          fields: [
            {
              name: 'gallery',
              type: 'group',
              label: false,
              fields: [
                { name: 'show', type: 'checkbox', defaultValue: false, admin: { description: 'List on the /prototypes page.' } },
                { name: 'summary', type: 'textarea', admin: { description: 'One or two lines for the gallery card.' } },
                { name: 'thumbnail', type: 'upload', relationTo: 'media' },
                { name: 'order', type: 'number', defaultValue: 100, admin: { description: 'Lower numbers first.' } },
              ],
            },
          ],
        },
      ],
    },
  ],
};

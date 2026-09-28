/* Posts: the blog (Phase 5). Word-style Lexical editing, an SEO tab shared
   with Demos, drafts + autosave + scheduled publishing, previews on the
   public host. Admins and writers write; only admins delete. Public routes
   are gated by BLOG_PUBLIC until launch. */

import {
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import { sessionSecret } from '../auth/session';
import { POST_BLOCKS } from '../blog/blocks';
import { EXCERPT_MAX_LENGTH } from '../blog/limits';
import { postPreviewPath, signPostPreviewToken } from '../blog/preview';
import { readingTimeMinutes } from '../blog/readingTime';
import { type PostLike, blogPathsToRevalidate, blogPathsToRevalidateOnDelete, blogUrlsToPing } from '../blog/revalidate';
import { slugify, validatePostSlug } from '../blog/slug';
import { redirectForSlugChange } from '../demos/redirects';
import { seoGroupField, seoPreviewField } from '../fields/seo';
import { type Revalidator, nextRevalidator, revalidateTargets } from '../revalidate';
import { isBlogPublic } from '../../lib/flags';
import { publicSiteOrigin } from '../settings';
import { submitIndexNow } from '../../../scripts/lib/indexnow.mjs';
import { canWrite, isAdmin, readPublishedOrEditor } from './Users';

export const EXCERPT_MAX = EXCERPT_MAX_LENGTH;

/* ---- beforeChange -------------------------------------------------------- */

/** Store the reading time with the post so lists never recompute it. */
export const computeReadingTime: CollectionBeforeChangeHook = ({ data }) => {
  if (data && 'body' in data) data.readingTime = readingTimeMinutes(data.body);
  return data;
};

/** The first publish stamps publishedAt (kept on later edits; editable). */
export const defaultPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data?._status === 'published' && !data.publishedAt && !originalDoc?.publishedAt) data.publishedAt = new Date().toISOString();
  return data;
};

/* ---- afterChange --------------------------------------------------------- */

type MinimalPayload = { findByID: (args: { collection: 'categories'; id: number | string; depth: number; overrideAccess: boolean }) => Promise<unknown> };

/** Hooks see the category as an id when the admin saves with depth 0; the
 *  planner needs its slug for /blog/category/<slug>. */
export async function withCategorySlug<T extends PostLike>(doc: T | null | undefined, payload: MinimalPayload): Promise<T | null | undefined> {
  const c = doc?.category;
  if (!doc || !c || typeof c === 'object') return doc;
  try {
    const cat = (await payload.findByID({ collection: 'categories', id: c, depth: 0, overrideAccess: true })) as { slug?: string | null } | null;
    return { ...doc, category: cat?.slug ? { slug: cat.slug } : null };
  } catch {
    return { ...doc, category: null };
  }
}

export function createRevalidateOnChange(revalidate: Revalidator = nextRevalidator): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req }) => {
    const [d, p] = await Promise.all([withCategorySlug(doc, req.payload), withCategorySlug(previousDoc, req.payload)]);
    await revalidateTargets(blogPathsToRevalidate(d!, p), req.payload.logger, revalidate);
    return doc;
  };
}

export function createRevalidateOnDelete(revalidate: Revalidator = nextRevalidator): CollectionAfterDeleteHook {
  return async ({ doc, req }) => {
    const d = await withCategorySlug(doc, req.payload);
    await revalidateTargets(blogPathsToRevalidateOnDelete(d!), req.payload.logger, revalidate);
    return doc;
  };
}

/** Tell IndexNow (Bing & co.) about a published/renamed post — production only. */
export function createPingOnPublish(submit: (urls: string[]) => Promise<{ status: number }> = submitIndexNow): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req }) => {
    if (process.env.VERCEL_ENV !== 'production') return doc;
    const urls = blogUrlsToPing(doc, previousDoc, 'https://blueprintcode.ai');
    if (!urls.length) return doc;
    try {
      const r = await submit(urls);
      req.payload.logger.info({ msg: 'posts: IndexNow', urls, status: r.status });
    } catch (err) {
      req.payload.logger.warn({ msg: 'posts: IndexNow failed', urls, err: String(err) });
    }
    return doc;
  };
}

/** Keep the old URL alive when a published post's slug changes. */
export const keepOldPostUrl: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update') return doc;
  const plan = redirectForSlugChange(previousDoc, doc, '/blog');
  if (!plan || (doc as { _status?: string })._status !== 'published') return doc;
  const existing = await req.payload.find({ collection: 'redirects', where: { from: { equals: plan.from } }, limit: 1, overrideAccess: true });
  if (existing.totalDocs === 0) {
    await req.payload.create({
      collection: 'redirects',
      data: { from: plan.from, to: plan.to, permanent: true, note: `Post slug renamed (${doc.id})` },
      overrideAccess: true,
    });
  }
  return doc;
};

export const revalidateOnChange = createRevalidateOnChange();
export const revalidateOnDelete = createRevalidateOnDelete();
export const pingSearchEnginesOnPublish = createPingOnPublish();

/* ---- the editor ----------------------------------------------------------- */

export const postBodyEditor = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    LinkFeature({ enabledCollections: ['posts'] }),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    UploadFeature({ collections: { media: { fields: [{ name: 'caption', type: 'text' }] } } }),
    EXPERIMENTAL_TableFeature(),
    BlocksFeature({ blocks: POST_BLOCKS }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
});

/* ---- the collection ------------------------------------------------------- */

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', '_status', 'publishedAt'],
    group: 'Content',
    description: 'Blog posts, published at blueprintcode.ai/blog/<slug>.',
    components: {
      // "View live" next to Preview once the post has a published version.
      edit: {
        beforeDocumentControls: [
          { path: '/cms/components/LiveLink.client#LiveLink', clientProps: { siteUrl: publicSiteOrigin(), pathPrefix: '/blog/', sectionPublic: isBlogPublic(), flagName: 'BLOG_PUBLIC' } },
        ],
      },
    },
    // Preview opens the latest draft on the public host with a 30-minute token.
    preview: async (doc) => `${publicSiteOrigin()}${postPreviewPath(String(doc.id), await signPostPreviewToken(String(doc.id), sessionSecret()))}`,
  },
  access: { create: canWrite, read: readPublishedOrEditor, update: canWrite, delete: isAdmin },
  versions: { drafts: { autosave: { interval: 1500 }, schedulePublish: true }, maxPerDoc: 25 },
  hooks: {
    beforeChange: [computeReadingTime, defaultPublishedAt],
    afterChange: [keepOldPostUrl, revalidateOnChange, pingSearchEnginesOnPublish],
    afterDelete: [revalidateOnDelete],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true, admin: { description: 'The headline. Also the browser tab title and search result title unless overridden in SEO.' } },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              validate: (v: unknown) => validatePostSlug(v) ?? true,
              hooks: {
                beforeValidate: [({ value, siblingData }) => (value ? value : siblingData?.title ? slugify(String(siblingData.title)) : value)],
              },
              admin: { description: 'The URL: blueprintcode.ai/blog/<slug>. Lowercase letters, numbers, hyphens. Renaming a published post adds a redirect.' },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              maxLength: EXCERPT_MAX,
              admin: { description: `One or two sentences for cards, the feed and (unless overridden) the meta description. Max ${EXCERPT_MAX} characters.` },
            },
            { name: 'cover', type: 'upload', relationTo: 'media', admin: { description: 'Lead image, also the social share image unless SEO sets one. Ideally 1600×900 or wider.' } },
            { name: 'body', type: 'richText', required: true, editor: postBodyEditor },
            {
              type: 'row',
              fields: [
                { name: 'category', type: 'relationship', relationTo: 'categories', admin: { width: '50%' } },
                { name: 'author', type: 'relationship', relationTo: 'authors', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'publishedAt',
                  type: 'date',
                  admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' }, description: 'Set automatically on first publish; edit to backdate.' },
                },
                { name: 'readingTime', type: 'number', admin: { width: '50%', readOnly: true, description: 'Minutes, computed from the body on save.' } },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoPreviewField({ pathPrefix: '/blog/', noun: 'post' }), seoGroupField()],
        },
      ],
    },
  ],
};

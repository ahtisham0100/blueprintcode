/* The SEO tab shared by Demos and Posts: a live search preview (client
   component) above the `seo` group. One definition so the two collections
   can never drift apart and the public renderers can rely on one shape. */

import type { Field } from 'payload';

export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

export type SeoGroup = {
  metaTitle?: string | null;
  description?: string | null;
  canonical?: string | null;
  noindex?: boolean | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: { url?: string | null; width?: number | null; height?: number | null; alt?: string | null } | number | string | null;
  jsonLd?: unknown;
};

/** The live preview. `pathPrefix` is the URL base the slug lives under ('/' for demos, '/blog/' for posts). */
export function seoPreviewField(opts: { pathPrefix: string; noun: string }): Field {
  return {
    name: 'seoPreview',
    type: 'ui',
    admin: { components: { Field: { path: '/cms/components/SeoPreview.client#SeoPreview', clientProps: opts } } },
  };
}

export function seoGroupField(): Field {
  return {
    name: 'seo',
    type: 'group',
    label: false,
    fields: [
      { name: 'metaTitle', type: 'text', maxLength: SEO_TITLE_MAX, admin: { description: `Overrides the title tag (max ${SEO_TITLE_MAX} characters).` } },
      { name: 'description', type: 'textarea', maxLength: SEO_DESCRIPTION_MAX, admin: { description: `Meta description (max ${SEO_DESCRIPTION_MAX} characters).` } },
      { name: 'canonical', type: 'text', admin: { description: 'Only if this page is a copy of another URL. Leave empty for the page itself.' } },
      { name: 'noindex', type: 'checkbox', defaultValue: false, admin: { description: 'Keep out of search engines.' } },
      { name: 'ogTitle', type: 'text', admin: { description: 'Social share title (defaults to the title).' } },
      { name: 'ogDescription', type: 'textarea', admin: { description: 'Social share description (defaults to the meta description).' } },
      { name: 'ogImage', type: 'upload', relationTo: 'media', admin: { description: 'Social share image, ideally 1200×630.' } },
      { name: 'jsonLd', type: 'json', admin: { description: 'Optional extra structured data (JSON-LD object).' } },
    ],
  };
}

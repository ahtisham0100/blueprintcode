/* Turns a demo record into the HTML document the public site serves:
   the pasted document + generated SEO head tags + the site chrome. Pure;
   the partial templates are passed in (see partials.ts). */

import { injectChrome, metaFromSlug } from '../../../scripts/lib/chrome.mjs';

export type DemoForRender = {
  slug: string;
  title: string;
  label?: string | null;
  html: string;
  seo?: {
    metaTitle?: string | null;
    description?: string | null;
    canonical?: string | null;
    noindex?: boolean | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: { url?: string | null; width?: number | null; height?: number | null; alt?: string | null } | number | string | null;
    jsonLd?: unknown;
  } | null;
};

export type RenderOptions = {
  siteUrl: string;
  headerTpl: string;
  footerTpl: string;
  /** Force noindex + skip canonical (previews). */
  preview?: boolean;
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Remove the tags we generate so the pasted document cannot contradict them. */
export function stripManagedHeadTags(html: string): string {
  return html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>\s*/gi, '')
    .replace(/<meta\b[^>]*\bname\s*=\s*["'](?:description|robots)["'][^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*\bproperty\s*=\s*["']og:[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<meta\b[^>]*\bname\s*=\s*["']twitter:[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>\s*/gi, '');
}

/** The <head> tags for a demo, in order. */
export function seoHeadTags(demo: DemoForRender, opts: { siteUrl: string; preview?: boolean }): string {
  const seo = demo.seo ?? {};
  const url = `${opts.siteUrl}/${demo.slug}`;
  const title = (seo.metaTitle || demo.title).trim();
  const description = (seo.description ?? '').trim();
  const ogTitle = (seo.ogTitle || title).trim();
  const ogDescription = (seo.ogDescription || description).trim();
  const image = typeof seo.ogImage === 'object' && seo.ogImage ? seo.ogImage : null;
  const noindex = Boolean(seo.noindex) || Boolean(opts.preview);

  const tags: string[] = [`<title>${escapeHtml(title)}</title>`];
  if (description) tags.push(`<meta name="description" content="${escapeHtml(description)}">`);
  tags.push(`<meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}">`);
  if (!opts.preview) tags.push(`<link rel="canonical" href="${escapeHtml((seo.canonical || url).trim())}">`);
  tags.push(`<meta property="og:type" content="website">`);
  tags.push(`<meta property="og:url" content="${escapeHtml(url)}">`);
  tags.push(`<meta property="og:title" content="${escapeHtml(ogTitle)}">`);
  if (ogDescription) tags.push(`<meta property="og:description" content="${escapeHtml(ogDescription)}">`);
  tags.push(`<meta property="og:site_name" content="Blueprint Code AI">`);
  if (image?.url) {
    tags.push(`<meta property="og:image" content="${escapeHtml(image.url)}">`);
    if (image.width && image.height) {
      tags.push(`<meta property="og:image:width" content="${image.width}">`);
      tags.push(`<meta property="og:image:height" content="${image.height}">`);
    }
    if (image.alt) tags.push(`<meta property="og:image:alt" content="${escapeHtml(image.alt)}">`);
    tags.push(`<meta name="twitter:card" content="summary_large_image">`);
  } else {
    tags.push(`<meta name="twitter:card" content="summary">`);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url,
    ...(description ? { description } : {}),
    isPartOf: { '@type': 'WebSite', name: 'Blueprint Code AI', url: opts.siteUrl },
    ...(image?.url ? { primaryImageOfPage: { '@type': 'ImageObject', url: image.url } } : {}),
  };
  const blocks = [jsonLd, ...(seo.jsonLd && typeof seo.jsonLd === 'object' ? [seo.jsonLd] : [])];
  for (const b of blocks) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(b).replace(/</g, '\\u003c')}</script>`);
  }
  return tags.join('\n');
}

/** Full document: managed head tags + chrome + watermark. */
export function renderDemoDocument(demo: DemoForRender, opts: RenderOptions): { html: string; warnings: string[] } {
  const head = seoHeadTags(demo, { siteUrl: opts.siteUrl, preview: opts.preview });
  let html = stripManagedHeadTags(demo.html);
  const marker = '<!--BPC:SEO:START-->';
  const block = `${marker}\n${head}\n<!--BPC:SEO:END-->`;
  html = /<!--BPC:SEO:START-->[\s\S]*?<!--BPC:SEO:END-->/.test(html)
    ? html.replace(/<!--BPC:SEO:START-->[\s\S]*?<!--BPC:SEO:END-->/, block)
    : html.replace(/(<head[^>]*>)/i, `$1\n${block}`);
  const meta = metaFromSlug(demo.slug, { label: demo.label?.trim() || undefined, doc: demo.title.toUpperCase() });
  return injectChrome(html, meta, { headerTpl: opts.headerTpl, footerTpl: opts.footerTpl, watermark: true });
}

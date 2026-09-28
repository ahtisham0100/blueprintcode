/* Next `Metadata` for the blog pages, from the post/listing data. Pure; the
   pages call these from generateMetadata. Mirrors what demos/render.ts
   emits for demos, in Next's metadata shape instead of raw tags. */

import type { Metadata } from 'next';
import type { SeoGroup } from '../fields/seo';
import { OG_DEFAULTS, SITE_URL } from '../../lib/seo';

type MediaLike = { url?: string | null; alt?: string | null; width?: number | null; height?: number | null; sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null } | null | undefined> | null };

export type PostForMeta = {
  title: string;
  slug: string;
  excerpt?: string | null;
  cover?: MediaLike | number | string | null;
  seo?: SeoGroup | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: { name?: string | null } | number | string | null;
  category?: { name?: string | null } | number | string | null;
};

type OgImage = { url: string; width?: number; height?: number; alt?: string };

function asMedia(v: unknown): MediaLike | null {
  return v && typeof v === 'object' ? (v as MediaLike) : null;
}

/** The share image: SEO override, else the cover's large WebP (or original), else the site default. */
export function shareImage(post: Pick<PostForMeta, 'cover' | 'seo'>): OgImage | null {
  const pick = (m: MediaLike | null): OgImage | null => {
    if (!m?.url) return null;
    const large = m.sizes?.large?.url ? m.sizes.large : null;
    return {
      url: large?.url ?? m.url,
      width: (large?.width ?? m.width) || undefined,
      height: (large?.height ?? m.height) || undefined,
      alt: m.alt || undefined,
    };
  };
  return pick(asMedia(post.seo?.ogImage)) ?? pick(asMedia(post.cover));
}

export function postTitle(post: Pick<PostForMeta, 'title' | 'seo'>): string {
  return (post.seo?.metaTitle || post.title).trim();
}

export function postDescription(post: Pick<PostForMeta, 'excerpt' | 'seo'>): string {
  return (post.seo?.description || post.excerpt || '').trim();
}

export function postMetadata(post: PostForMeta, opts: { siteUrl?: string; preview?: boolean } = {}): Metadata {
  const siteUrl = opts.siteUrl ?? SITE_URL;
  const url = `${siteUrl}/blog/${post.slug}`;
  const title = postTitle(post);
  const description = postDescription(post);
  const image = shareImage(post);
  const noindex = Boolean(post.seo?.noindex) || Boolean(opts.preview);
  const author = post.author && typeof post.author === 'object' ? post.author.name : null;
  const section = post.category && typeof post.category === 'object' ? post.category.name : null;

  return {
    title,
    ...(description ? { description } : {}),
    robots: noindex ? { index: false, follow: !opts.preview } : { index: true, follow: true, 'max-image-preview': 'large' },
    ...(opts.preview ? {} : { alternates: { canonical: (post.seo?.canonical || url).trim() } }),
    openGraph: {
      ...OG_DEFAULTS,
      ...(image ? { images: [image] } : {}),
      type: 'article',
      url,
      title: (post.seo?.ogTitle || title).trim(),
      ...(post.seo?.ogDescription || description ? { description: (post.seo?.ogDescription || description).trim() } : {}),
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(post.updatedAt ? { modifiedTime: post.updatedAt } : {}),
      ...(author ? { authors: [author] } : {}),
      ...(section ? { section } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
  };
}

/** Index, page n and category listings. Page n ≥ 2 gets its own canonical. */
export function listingMetadata(opts: { title: string; description: string; path: string; page?: number; siteUrl?: string }): Metadata {
  const siteUrl = opts.siteUrl ?? SITE_URL;
  const page = opts.page && opts.page >= 2 ? opts.page : 1;
  const url = `${siteUrl}${opts.path}${page >= 2 ? `/page/${page}` : ''}`;
  const title = page >= 2 ? `${opts.title} — page ${page}` : opts.title;
  return {
    title,
    description: opts.description,
    alternates: { canonical: url },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: { ...OG_DEFAULTS, type: 'website', url, title, description: opts.description },
    twitter: { card: 'summary' },
  };
}

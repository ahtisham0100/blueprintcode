/* /blog/page/<n> — index pages 2… (12 posts each). /blog/page/1 is a 404:
   page 1 is /blog itself, and one URL per page keeps canonicals clean. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listingMetadata } from '@/cms/blog/metadata';
import { POSTS_PER_PAGE, pageCount, parsePageParam } from '@/cms/blog/paginate';
import { isBlogPublic } from '@/lib/flags';
import { BLOG_DESCRIPTION, BLOG_NAME } from '@/lib/seo';
import { loadPublishedPosts } from '@/cms/blog/load';
import { BlogListing } from '../../ui';

// A day as the safety net; the Posts hooks revalidate on every publish.
export const revalidate = 86400;
export const dynamicParams = true;

type Ctx = { params: Promise<{ n: string }> };

export async function generateStaticParams() {
  if (!isBlogPublic()) return [];
  try {
    const { totalDocs } = await loadPublishedPosts({ page: 1, perPage: 1 });
    return Array.from({ length: Math.max(0, pageCount(totalDocs, POSTS_PER_PAGE) - 1) }, (_, i) => ({ n: String(i + 2) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const page = parsePageParam((await params).n);
  if (!isBlogPublic() || !page) return {};
  return listingMetadata({ title: BLOG_NAME, description: BLOG_DESCRIPTION, path: '/blog', page });
}

export default async function BlogPageN({ params }: Ctx) {
  if (!isBlogPublic()) notFound();
  const page = parsePageParam((await params).n);
  if (!page) notFound();
  return <BlogListing page={page} />;
}

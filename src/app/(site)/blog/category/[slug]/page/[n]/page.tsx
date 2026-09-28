/* /blog/category/<slug>/page/<n> — category index pages 2…. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listingMetadata } from '@/cms/blog/metadata';
import { parsePageParam } from '@/cms/blog/paginate';
import { isBlogPublic } from '@/lib/flags';
import { BLOG_DESCRIPTION } from '@/lib/seo';
import { BlogListing, getCategory } from '../../../../ui';

// A day as the safety net; the Posts hooks revalidate on every publish.
export const revalidate = 86400;
export const dynamicParams = true;

type Ctx = { params: Promise<{ slug: string; n: string }> };

export async function generateStaticParams() {
  // Category pages beyond the first are rare; build them on demand.
  return [];
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  const { slug, n } = await params;
  const page = parsePageParam(n);
  if (!isBlogPublic() || !page) return {};
  const category = await getCategory(slug);
  if (!category) return {};
  return listingMetadata({ title: `${category.name} — Blueprint Code AI blog`, description: category.description || BLOG_DESCRIPTION, path: `/blog/category/${category.slug}`, page });
}

export default async function CategoryPageN({ params }: Ctx) {
  if (!isBlogPublic()) notFound();
  const { slug, n } = await params;
  const page = parsePageParam(n);
  if (!page) notFound();
  const category = await getCategory(slug);
  if (!category) notFound();
  return <BlogListing page={page} category={category} />;
}

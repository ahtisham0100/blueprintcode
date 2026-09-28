/* /blog/category/<slug> — the index filtered to one category, page 1. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listingMetadata } from '@/cms/blog/metadata';
import { loadCategories } from '@/cms/blog/load';
import { isBlogPublic } from '@/lib/flags';
import { BLOG_DESCRIPTION } from '@/lib/seo';
import { BlogListing, getCategory, getPosts } from '../../ui';

// A day as the safety net; the Posts hooks revalidate on every publish.
export const revalidate = 86400;
export const dynamicParams = true;

type Ctx = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  if (!isBlogPublic()) return [];
  try {
    return (await loadCategories()).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  if (!isBlogPublic()) return {};
  const category = await getCategory((await params).slug);
  if (!category) return {};
  const { totalDocs } = await getPosts(1, category.id);
  return listingMetadata({ title: `${category.name} — Blueprint Code AI blog`, description: category.description || BLOG_DESCRIPTION, path: `/blog/category/${category.slug}`, empty: totalDocs === 0 });
}

export default async function CategoryPage({ params }: Ctx) {
  if (!isBlogPublic()) notFound();
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  return <BlogListing page={1} category={category} />;
}

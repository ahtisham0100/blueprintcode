/* /blog — the index, page 1. Static + ISR; the Posts hooks revalidate it on
   publish. Behind BLOG_PUBLIC until launch: off means the site's 404. */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listingMetadata } from '@/cms/blog/metadata';
import { isBlogPublic } from '@/lib/flags';
import { BLOG_DESCRIPTION, BLOG_NAME } from '@/lib/seo';
import { BlogListing } from './ui';

// A day as the safety net; the Posts hooks revalidate on every publish.
export const revalidate = 86400;

export function generateMetadata(): Metadata {
  if (!isBlogPublic()) return {};
  return listingMetadata({ title: BLOG_NAME, description: BLOG_DESCRIPTION, path: '/blog' });
}

export default async function BlogIndexPage() {
  if (!isBlogPublic()) notFound();
  return <BlogListing page={1} />;
}

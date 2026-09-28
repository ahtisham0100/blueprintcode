/* /blog/<slug> — a published post. A React page (not raw HTML like demos):
   the (site) layout supplies header/footer, this file the metadata, the
   BlogPosting + BreadcrumbList structured data and the article. Static +
   ISR; publishing, renaming and unpublishing revalidate it. A renamed
   post's old URL 308s via the redirect row the Posts hook wrote. */

import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { loadAdjacentPosts, loadAllPublishedPosts } from '@/cms/blog/load';
import { postMetadata } from '@/cms/blog/metadata';
import { loadRedirect } from '@/cms/demos/load';
import { isBlogPublic } from '@/lib/flags';
import { PostArticle, getPost } from '../ui';

// A day as the safety net; the Posts hooks revalidate on every publish.
export const revalidate = 86400;
export const dynamicParams = true;

type Ctx = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  if (!isBlogPublic()) return [];
  try {
    return (await loadAllPublishedPosts(0)).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Ctx): Promise<Metadata> {
  if (!isBlogPublic()) return {};
  const post = await getPost((await params).slug);
  return post ? postMetadata(post) : {};
}

export default async function PostPage({ params }: Ctx) {
  if (!isBlogPublic()) notFound();
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    const r = await loadRedirect(`/blog/${slug}`);
    if (r) (r.permanent ? permanentRedirect : redirect)(r.to);
    notFound();
  }
  const { prev, next } = await loadAdjacentPosts(post);
  return (
    <main id="main" className="blog">
      <PostArticle post={post} prev={prev} next={next} />
    </main>
  );
}

/* GET /blog/feed.xml — RSS 2.0 of the latest posts with full HTML bodies.
   Static + ISR like the pages; revalidated by the Posts hooks. */

import { rel } from '@/cms/blog/format';
import { loadAllPublishedPosts } from '@/cms/blog/load';
import { postDescription } from '@/cms/blog/metadata';
import { postBodyToHtml } from '@/cms/blog/renderHtml';
import { FEED_PATH, RSS_CONTENT_TYPE, absolutiseUrls, buildRssFeed } from '@/cms/blog/rss';
import { isBlogPublic } from '@/lib/flags';
import { BLOG_DESCRIPTION, BLOG_NAME, BLOG_URL, SITE_URL } from '@/lib/seo';
import type { Author, Category } from '@/payload-types';

// A day as the safety net; the Posts hooks revalidate on every publish.
export const revalidate = 86400;

const FEED_ITEMS = 50;

export async function GET() {
  if (!isBlogPublic()) return new Response('Not found', { status: 404, headers: { 'cache-control': 'public, max-age=0, s-maxage=60' } });

  const posts = (await loadAllPublishedPosts(2)).slice(0, FEED_ITEMS);
  const xml = buildRssFeed({
    title: BLOG_NAME,
    description: BLOG_DESCRIPTION,
    siteUrl: SITE_URL,
    feedPath: FEED_PATH,
    items: posts.map((p) => ({
      title: p.title,
      url: `${BLOG_URL}/${p.slug}`,
      description: postDescription(p) || null,
      publishedAt: p.publishedAt,
      author: rel<Author>(p.author)?.name ?? null,
      category: rel<Category>(p.category)?.name ?? null,
      content: absolutiseUrls(postBodyToHtml(p.body as never), SITE_URL),
    })),
  });
  return new Response(xml, {
    headers: { 'content-type': RSS_CONTENT_TYPE, 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=60' },
  });
}

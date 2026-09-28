/* RSS 2.0 for the blog. Pure: docs in, XML out; the /blog/feed.xml route
   loads the posts and serves the string. */

export const RSS_CONTENT_TYPE = 'application/rss+xml; charset=utf-8';
export const FEED_PATH = '/blog/feed.xml';

export type RssItem = {
  title: string;
  url: string;
  description?: string | null;
  publishedAt?: string | null;
  author?: string | null;
  category?: string | null;
  /** Full HTML body; emitted in a CDATA content:encoded element. */
  content?: string | null;
};

export type RssFeedOptions = {
  title: string;
  description: string;
  siteUrl: string;
  feedPath: string;
  items: RssItem[];
  lastBuildDate?: Date;
  language?: string;
};

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function rfc822(iso: string | Date): string | null {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return Number.isNaN(d.getTime()) ? null : d.toUTCString();
}

/** Feed readers show the item away from the site: make root-relative links and images absolute. */
export function absolutiseUrls(html: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return html.replace(/\b(href|src|srcSet|srcset)=("|')\/(?!\/)/g, (_m, attr, q) => `${attr}=${q}${base}/`);
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export function buildRssFeed(opts: RssFeedOptions): string {
  const time = (i: RssItem) => (i.publishedAt ? new Date(i.publishedAt).getTime() : NaN);
  const items = [...opts.items].sort((a, b) => {
    const ta = time(a);
    const tb = time(b);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '<channel>',
    `<title>${escapeXml(opts.title)}</title>`,
    `<link>${escapeXml(`${opts.siteUrl}/blog`)}</link>`,
    `<description>${escapeXml(opts.description)}</description>`,
    `<language>${escapeXml(opts.language ?? 'en-GB')}</language>`,
    `<atom:link href="${escapeXml(`${opts.siteUrl}${opts.feedPath}`)}" rel="self" type="application/rss+xml"/>`,
    `<lastBuildDate>${(opts.lastBuildDate ?? new Date()).toUTCString()}</lastBuildDate>`,
  ];
  for (const i of items) {
    lines.push('<item>');
    lines.push(`<title>${escapeXml(i.title)}</title>`);
    lines.push(`<link>${escapeXml(i.url)}</link>`);
    lines.push(`<guid isPermaLink="true">${escapeXml(i.url)}</guid>`);
    const date = i.publishedAt ? rfc822(i.publishedAt) : null;
    if (date) lines.push(`<pubDate>${date}</pubDate>`);
    if (i.description) lines.push(`<description>${escapeXml(i.description)}</description>`);
    if (i.author) lines.push(`<dc:creator>${escapeXml(i.author)}</dc:creator>`);
    if (i.category) lines.push(`<category>${escapeXml(i.category)}</category>`);
    if (i.content) lines.push(`<content:encoded>${cdata(i.content)}</content:encoded>`);
    lines.push('</item>');
  }
  lines.push('</channel>', '</rss>');
  return lines.join('\n');
}

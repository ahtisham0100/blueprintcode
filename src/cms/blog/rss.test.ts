import { describe, expect, it } from 'vitest';
import { RSS_CONTENT_TYPE, absolutiseUrls, buildRssFeed, escapeXml, rfc822 } from './rss';

describe('escapeXml', () => {
  it('escapes the five XML specials', () => {
    expect(escapeXml(`Tom & Jerry <b>"quoted" 'single'</b>`)).toBe('Tom &amp; Jerry &lt;b&gt;&quot;quoted&quot; &apos;single&apos;&lt;/b&gt;');
  });
});

describe('buildRssFeed', () => {
  const feed = buildRssFeed({
    title: 'Blueprint Code AI — Blog',
    description: 'Notes & <ideas>',
    siteUrl: 'https://blueprintcode.ai',
    feedPath: '/blog/feed.xml',
    items: [
      { title: 'Older', url: 'https://blueprintcode.ai/blog/older', publishedAt: '2026-08-19T09:00:00.000Z', description: 'first' },
      {
        title: 'Newer & better',
        url: 'https://blueprintcode.ai/blog/newer',
        publishedAt: '2026-09-10T09:00:00.000Z',
        description: 'A <p>tag</p>',
        author: 'James',
        category: 'Strategy',
        content: '<p>Body &amp; soul</p>',
      },
      { title: 'Undated', url: 'https://blueprintcode.ai/blog/undated' },
    ],
    lastBuildDate: new Date('2026-09-28T12:00:00.000Z'),
  });

  it('is RSS 2.0 with a self link and the channel metadata escaped', () => {
    expect(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(feed).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/"');
    expect(feed).toContain('<atom:link href="https://blueprintcode.ai/blog/feed.xml" rel="self" type="application/rss+xml"/>');
    expect(feed).toContain('<link>https://blueprintcode.ai/blog</link>');
    expect(feed).toContain('<description>Notes &amp; &lt;ideas&gt;</description>');
    expect(feed).toContain('<lastBuildDate>Mon, 28 Sep 2026 12:00:00 GMT</lastBuildDate>');
    expect(RSS_CONTENT_TYPE).toBe('application/rss+xml; charset=utf-8');
  });

  it('lists items newest first, undated last, with guid, pubDate and escaped fields', () => {
    const order = [...feed.matchAll(/<title>([^<]+)<\/title>/g)].map((m) => m[1]).slice(1);
    expect(order).toEqual(['Newer &amp; better', 'Older', 'Undated']);
    expect(feed).toContain('<guid isPermaLink="true">https://blueprintcode.ai/blog/newer</guid>');
    expect(feed).toContain('<pubDate>Thu, 10 Sep 2026 09:00:00 GMT</pubDate>');
    expect(feed).toContain('<description>A &lt;p&gt;tag&lt;/p&gt;</description>');
    expect(feed).toContain('<dc:creator>James</dc:creator>');
    expect(feed).toContain('<category>Strategy</category>');
    expect(feed).toContain('<content:encoded><![CDATA[<p>Body &amp; soul</p>]]></content:encoded>');
    expect(feed).not.toMatch(/<pubDate><\/pubDate>/);
  });

  it('absolutises root-relative links and images for readers', () => {
    expect(absolutiseUrls('<a href="/pricing">x</a><img src="/media/a.png" srcSet="/m 1w"><a href="//cdn/x">y</a><a href="https://z/">z</a>', 'https://blueprintcode.ai/')).toBe(
      '<a href="https://blueprintcode.ai/pricing">x</a><img src="https://blueprintcode.ai/media/a.png" srcSet="https://blueprintcode.ai/m 1w"><a href="//cdn/x">y</a><a href="https://z/">z</a>',
    );
  });

  it('formats dates as RFC 822', () => {
    expect(rfc822('2026-09-10T09:00:00.000Z')).toBe('Thu, 10 Sep 2026 09:00:00 GMT');
    expect(rfc822('garbage')).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Dashboard, statusListHref } from './Dashboard';

function fakePayload() {
  return {
    find: vi.fn(async () => ({ docs: [] })),
    count: vi.fn(async ({ collection, where }: { collection: string; where: Record<string, { equals?: string }> }) => ({
      totalDocs: collection === 'payload-jobs' ? 1 : where?._status?.equals === 'published' ? 3 : 2,
    })),
  };
}

async function render(role: 'admin' | 'writer') {
  const payload = fakePayload();
  const el = await Dashboard({ payload, user: { email: `${role}@blueprintcode.ai`, role } } as never);
  return { html: renderToStaticMarkup(el), payload };
}

describe('Dashboard', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('shows admins blog and demo counts (no lists), media and both public-site flags', async () => {
    vi.stubEnv('BLOG_PUBLIC', 'on');
    const { html, payload } = await render('admin');
    expect(html).toContain('Blog posts');
    expect(html).toContain('Demos');
    expect(html).toContain('>New post<');
    expect(html).toContain('>New demo<');
    expect(html).toContain('CMS demos on the public site');
    expect(html).toMatch(/Blog on the public site<\/dt><dd><span class="bpc-pill is-published">live/);
    expect(html).not.toContain('bpc-dash__list');
    // Only media is listed; posts and demos are counted.
    expect(payload.find).toHaveBeenCalledTimes(1);
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'media' }));
    expect(payload.count).toHaveBeenCalledWith(expect.objectContaining({ collection: 'demos' }));
  });

  it('shows writers the blog and media only, without counting demos', async () => {
    vi.stubEnv('BLOG_PUBLIC', '');
    const { html, payload } = await render('writer');
    expect(html).toContain('Blog posts');
    expect(html).toContain('>New post<');
    expect(html).not.toContain('New demo');
    expect(html).not.toMatch(/>Demos</);
    expect(html).not.toContain('CMS demos on the public site');
    expect(html).toContain('off (BLOG_PUBLIC)');
    expect(payload.count).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'demos' }));
  });

  it('links each number to the list filtered to what it counts', async () => {
    const { html } = await render('admin');
    expect(html).toContain('<a href="/cms/collections/posts?where%5B_status%5D%5Bequals%5D=published"><b>3</b><span>published</span></a>');
    expect(html).toContain('<a href="/cms/collections/posts?where%5B_status%5D%5Bequals%5D=draft"><b>2</b><span>drafts</span></a>');
    expect(html).toContain('<a href="/cms/collections/posts"><b>1</b><span>scheduled</span></a>');
    expect(html).toContain('<a href="/cms/collections/demos?where%5B_status%5D%5Bequals%5D=draft"><b>2</b><span>drafts</span></a>');
    expect(statusListHref('/cms', 'demos')).toBe('/cms/collections/demos');
  });
});

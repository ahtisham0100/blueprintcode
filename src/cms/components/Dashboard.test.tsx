import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Dashboard } from './Dashboard';

const post = { id: 1, title: 'Cost bands', slug: 'cost', _status: 'published', updatedAt: '2026-09-28T10:00:00.000Z' };
const demo = { id: 9, title: 'Woodlawn', slug: 'woodlawn', _status: 'draft', updatedAt: '2026-09-28T10:00:00.000Z' };

function fakePayload() {
  return {
    find: vi.fn(async ({ collection }: { collection: string }) => ({ docs: collection === 'posts' ? [post] : collection === 'demos' ? [demo] : [] })),
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

  it('shows admins the blog, demos, media and both public-site flags', async () => {
    vi.stubEnv('BLOG_PUBLIC', 'on');
    const { html, payload } = await render('admin');
    expect(html).toContain('Blog posts');
    expect(html).toContain('/blog/cost');
    expect(html).toContain('>New post<');
    expect(html).toContain('>New demo<');
    expect(html).toContain('Woodlawn');
    expect(html).toContain('CMS demos on the public site');
    expect(html).toContain('Blog on the public site');
    expect(html).toMatch(/Blog on the public site<\/dt><dd><span class="bpc-pill is-published">live/);
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({ collection: 'demos' }));
  });

  it('shows writers the blog and media only, without querying demos', async () => {
    vi.stubEnv('BLOG_PUBLIC', '');
    const { html, payload } = await render('writer');
    expect(html).toContain('Blog posts');
    expect(html).toContain('>New post<');
    expect(html).not.toContain('New demo');
    expect(html).not.toContain('Woodlawn');
    expect(html).not.toContain('CMS demos on the public site');
    expect(html).toContain('off (BLOG_PUBLIC)');
    expect(payload.find).not.toHaveBeenCalledWith(expect.objectContaining({ collection: 'demos' }));
  });

  it('counts published, draft and scheduled posts', async () => {
    const { html } = await render('writer');
    expect(html).toMatch(/<b>3<\/b><span>published<\/span><\/div><div><b>2<\/b><span>drafts<\/span><\/div><div><b>1<\/b><span>scheduled<\/span>/);
  });
});

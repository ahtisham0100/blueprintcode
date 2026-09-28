import { afterEach, describe, expect, it, vi } from 'vitest';
import { Authors } from './Authors';
import { Categories } from './Categories';
import {
  EXCERPT_MAX,
  Posts,
  computeReadingTime,
  createPingOnPublish,
  createRevalidateOnChange,
  createRevalidateOnDelete,
  defaultPublishedAt,
  keepOldPostUrl,
  withCategorySlug,
} from './Posts';
import { canWrite, isAdmin, readPublishedOrEditor } from './Users';
import { BLOG_LISTING_TARGETS } from '../blog/revalidate';

const admin = { user: { id: 'a', role: 'admin', collection: 'users' } };
const writer = { user: { id: 'w', role: 'writer', collection: 'users' } };
const anon = { user: null };

type Field = { name?: string; type?: string; tabs?: { label: string; fields: Field[] }[]; fields?: Field[]; validate?: (v: unknown) => true | string; maxLength?: number };
function fieldNames(fields: Field[]): string[] {
  const out: string[] = [];
  for (const f of fields) {
    if (f.tabs) for (const t of f.tabs) out.push(...fieldNames(t.fields));
    else if (f.fields && f.name) out.push(...fieldNames(f.fields).map((n) => `${f.name}.${n}`));
    else if (f.fields) out.push(...fieldNames(f.fields));
    else if (f.name) out.push(f.name);
  }
  return out;
}
function findField(fields: Field[], name: string): Field | undefined {
  for (const f of fields) {
    if (f.name === name) return f;
    const inner = f.tabs ? f.tabs.flatMap((t) => t.fields) : f.fields;
    if (inner) {
      const r = findField(inner, name);
      if (r) return r;
    }
  }
}

const logger = { info: vi.fn(), warn: vi.fn() };
const payloadStub = (extra: Record<string, unknown> = {}) => ({ logger, findByID: vi.fn(async () => ({ slug: 'strategy' })), ...extra });

describe('Posts collection', () => {
  it('is written by admins and writers, deleted by admins, read publicly when published', () => {
    expect(Posts.slug).toBe('posts');
    expect(Posts.access).toEqual({ create: canWrite, read: readPublishedOrEditor, update: canWrite, delete: isAdmin });
    expect(canWrite({ req: admin } as never)).toBe(true);
    expect(canWrite({ req: writer } as never)).toBe(true);
    expect(canWrite({ req: anon } as never)).toBe(false);
    expect(readPublishedOrEditor({ req: admin } as never)).toBe(true);
    expect(readPublishedOrEditor({ req: writer } as never)).toBe(true);
    expect(readPublishedOrEditor({ req: anon } as never)).toEqual({ _status: { equals: 'published' } });
    expect(isAdmin({ req: writer } as never)).toBe(false);
  });

  it('has drafts, autosave, scheduled publishing and a public-host preview', async () => {
    const v = Posts.versions as { drafts: { autosave: unknown; schedulePublish: boolean }; maxPerDoc: number };
    expect(v.drafts.schedulePublish).toBe(true);
    expect(v.drafts.autosave).toBeTruthy();
    expect(v.maxPerDoc).toBeGreaterThan(0);
    vi.stubEnv('PUBLIC_SITE_URL', 'http://127.0.0.1:5000');
    vi.stubEnv('PAYLOAD_SECRET', 'test-secret-that-is-long-enough-for-hs256-0123456789');
    const url = await (Posts.admin!.preview as unknown as (doc: { id: number }) => Promise<string>)({ id: 5 });
    expect(url).toMatch(/^http:\/\/127\.0\.0\.1:5000\/blog-preview\/5\?token=/);
    vi.unstubAllEnvs();
  });

  it('has the content and SEO fields in tabs, with the list showing title/category/status/date', () => {
    const names = fieldNames(Posts.fields as Field[]);
    expect(names).toEqual(
      expect.arrayContaining([
        'title', 'slug', 'excerpt', 'cover', 'body', 'category', 'author', 'publishedAt', 'readingTime',
        'seo.metaTitle', 'seo.description', 'seo.canonical', 'seo.noindex', 'seo.ogTitle', 'seo.ogDescription', 'seo.ogImage', 'seo.jsonLd',
      ]),
    );
    expect((Posts.fields[0] as Field).tabs!.map((t) => t.label)).toEqual(['Content', 'SEO']);
    expect(Posts.admin?.defaultColumns).toEqual(['title', 'category', '_status', 'publishedAt']);
    expect(Posts.admin?.group).toBe('Content');
    expect(findField(Posts.fields as Field[], 'excerpt')!.maxLength).toBe(EXCERPT_MAX);
  });

  it('validates the slug against the blog reserved list, not the site root list', () => {
    const slug = findField(Posts.fields as Field[], 'slug')!;
    expect(slug.validate!('category')).toMatch(/reserved/);
    expect(slug.validate!('pricing')).toBe(true);
    expect(slug.validate!('Bad Slug')).toMatch(/lowercase/);
  });

  it('computes reading time and stamps publishedAt on first publish only', () => {
    const body = { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'word '.repeat(450) }] }] } };
    const data: Record<string, unknown> = { body };
    computeReadingTime({ data } as never);
    expect(data.readingTime).toBe(2);

    const fresh: Record<string, unknown> = { _status: 'published' };
    defaultPublishedAt({ data: fresh, originalDoc: {} } as never);
    expect(typeof fresh.publishedAt).toBe('string');

    const dated: Record<string, unknown> = { _status: 'published', publishedAt: '2026-08-19T00:00:00.000Z' };
    defaultPublishedAt({ data: dated, originalDoc: {} } as never);
    expect(dated.publishedAt).toBe('2026-08-19T00:00:00.000Z');

    const republished: Record<string, unknown> = { _status: 'published' };
    defaultPublishedAt({ data: republished, originalDoc: { publishedAt: '2026-01-01T00:00:00.000Z' } } as never);
    expect(republished.publishedAt).toBeUndefined();

    const draft: Record<string, unknown> = { _status: 'draft' };
    defaultPublishedAt({ data: draft, originalDoc: {} } as never);
    expect(draft.publishedAt).toBeUndefined();
  });

  it('resolves a category id to its slug for the planner', async () => {
    const payload = payloadStub();
    expect(await withCategorySlug({ slug: 'a', category: 3 }, payload)).toEqual({ slug: 'a', category: { slug: 'strategy' } });
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ collection: 'categories', id: 3 }));
    expect(await withCategorySlug({ slug: 'a', category: { slug: 'x' } }, payload)).toEqual({ slug: 'a', category: { slug: 'x' } });
    expect(await withCategorySlug({ slug: 'a' }, payload)).toEqual({ slug: 'a' });
    expect(await withCategorySlug(undefined, payload)).toBeUndefined();
    payload.findByID.mockRejectedValueOnce(new Error('gone'));
    expect(await withCategorySlug({ slug: 'a', category: 9 }, payload)).toEqual({ slug: 'a', category: null });
  });

  it('revalidates through the planner on change and delete', async () => {
    const revalidate = vi.fn(async () => {});
    const req = { payload: payloadStub() };
    await createRevalidateOnChange(revalidate)({ doc: { slug: 'a', _status: 'published', category: 3 }, previousDoc: { slug: 'a', _status: 'draft' }, req } as never);
    expect(revalidate).toHaveBeenCalledWith([{ path: '/blog/a' }, { path: '/blog/category/strategy' }, ...BLOG_LISTING_TARGETS]);

    revalidate.mockClear();
    await createRevalidateOnChange(revalidate)({ doc: { slug: 'a', _status: 'draft' }, previousDoc: { slug: 'a', _status: 'draft' }, req } as never);
    expect(revalidate).not.toHaveBeenCalled();

    await createRevalidateOnDelete(revalidate)({ doc: { slug: 'a', _status: 'published' }, req } as never);
    expect(revalidate).toHaveBeenCalledWith([{ path: '/blog/a' }, ...BLOG_LISTING_TARGETS]);
  });

  it('logs rather than fails when revalidation throws', async () => {
    const req = { payload: payloadStub() };
    const hook = createRevalidateOnChange(async () => {
      throw new Error('no next here');
    });
    const doc = { slug: 'a', _status: 'published' };
    await expect(hook({ doc, previousDoc: undefined, req } as never)).resolves.toBe(doc);
    expect(logger.warn).toHaveBeenCalled();
  });

  describe('IndexNow ping', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('only runs in production and only for post URLs', async () => {
      const submit = vi.fn(async () => ({ status: 202 }));
      const req = { payload: payloadStub() };
      const args = { doc: { slug: 'b', _status: 'published' }, previousDoc: { slug: 'a', _status: 'published' }, req } as never;

      vi.stubEnv('VERCEL_ENV', 'preview');
      await createPingOnPublish(submit)(args);
      expect(submit).not.toHaveBeenCalled();

      vi.stubEnv('VERCEL_ENV', 'production');
      await createPingOnPublish(submit)(args);
      expect(submit).toHaveBeenCalledWith(['https://blueprintcode.ai/blog/b', 'https://blueprintcode.ai/blog/a']);

      submit.mockClear();
      await createPingOnPublish(submit)({ doc: { slug: 'a', _status: 'draft' }, previousDoc: { slug: 'a', _status: 'draft' }, req } as never);
      expect(submit).not.toHaveBeenCalled();
    });
  });

  it('writes a /blog redirect when a published post is renamed, once', async () => {
    const payload = { find: vi.fn(async () => ({ totalDocs: 0 })), create: vi.fn(async () => ({})) };
    const doc = { id: 7, slug: 'new-slug', _status: 'published' };
    await keepOldPostUrl({ doc, previousDoc: { slug: 'old-slug' }, operation: 'update', req: { payload } } as never);
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'redirects', data: expect.objectContaining({ from: '/blog/old-slug', to: '/blog/new-slug', permanent: true }) }),
    );
    payload.find.mockResolvedValueOnce({ totalDocs: 1 } as never);
    payload.create.mockClear();
    await keepOldPostUrl({ doc, previousDoc: { slug: 'older' }, operation: 'update', req: { payload } } as never);
    expect(payload.create).not.toHaveBeenCalled();
    await keepOldPostUrl({ doc: { ...doc, _status: 'draft' }, previousDoc: { slug: 'older' }, operation: 'update', req: { payload } } as never);
    await keepOldPostUrl({ doc, previousDoc: undefined, operation: 'create', req: { payload } } as never);
    expect(payload.create).not.toHaveBeenCalled();
  });
});

describe('Categories and Authors collections', () => {
  it('are managed by admins and writers, public to read, deleted by admins', () => {
    for (const c of [Categories, Authors]) {
      expect(c.access?.create).toBe(canWrite);
      expect(c.access?.update).toBe(canWrite);
      expect(c.access?.delete).toBe(isAdmin);
      expect((c.access?.read as () => boolean)()).toBe(true);
      expect(c.admin?.group).toBe('Content');
    }
    expect(Categories.slug).toBe('categories');
    expect(Authors.slug).toBe('authors');
  });

  it('have the expected fields with validated, unique slugs', () => {
    expect(fieldNames(Categories.fields as Field[])).toEqual(['name', 'slug', 'description']);
    expect(fieldNames(Authors.fields as Field[])).toEqual(['name', 'slug', 'title', 'bio', 'avatar', 'links.label', 'links.url']);
    for (const c of [Categories, Authors]) {
      const slug = findField(c.fields as Field[], 'slug') as Field & { unique: boolean };
      expect(slug.unique).toBe(true);
      expect(slug.validate!('feed.xml')).toEqual(expect.any(String));
      expect(slug.validate!('strategy')).toBe(true);
    }
  });
});
